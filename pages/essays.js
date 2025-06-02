// components/options.js
import { collection, doc, getDocs, orderBy, query, writeBatch } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchCsv } from '../lib/parsecsv';
import { db } from './api/firebase';

export default function Essays() {
  const router = useRouter();
  const [data, setData] = useState([]);
  
  const { tid } = router.query;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tid) {
        return;
    }

    let isCancelled = false;

    async function fetchData() {
        setLoading(true)
        // IMPORTANT: EDIT STAGE IN ENV VARIABLES (pilot, irr1, irr2, irr3, annotate)
        const stage = process.env.NEXT_PUBLIC_STAGE;
        console.log(stage);
        const colRef = collection(db, 'feedbackEval', tid, stage);
        const q = query(colRef, orderBy('index'));
        const querySnapshot = await getDocs(q);
        console.log(querySnapshot.docs)
        if (isCancelled) return;

        if (querySnapshot.empty) {
            console.log("no essays in the collection!")
            try {
                const filepath = `${stage}.csv`;
                console.log(`reading from ${filepath}`)
                const csvData = await fetchCsv(filepath);
                const batch = writeBatch(db);
                const essaysWritten = new Set();
                const essays = [];
                let essayCount = 0;
                csvData.forEach(row => {
                    const essayId = row['essay_id'];
                    if (!essayId || essayId.trim() === '') {
                        console.warn('Skipping row with blank essay_id:', row);
                        return; // skip this row
                    }
                    if (!essaysWritten.has(essayId)) {
                      essayCount += 1;
                      const essayMeta = {
                        essay: row['essay'],
                        essayid: row['essay_id'],
                        assignment: row['instructions'],
                        grade: row['grade'],
                        type: row['type'],
                        title: `Essay ${essayCount}`,
                        index: essayCount
                      };
                      const essayDocRef = doc(db, 'feedbackEval', tid, stage, essayId);
                      batch.set(essayDocRef, essayMeta, { merge: true });
                      essays.push({id: essayId, ...essayMeta})
                      essaysWritten.add(essayId);
                    }

                    const commentId = row['comment_id'];
                    const commentMeta = {
                        excerpt: row['excerpt'],
                        comment: row['comment'],
                        startidx: Number(row['startidx']),
                        endidx: Number(row['endidx']),
                    }
                    const feedbackRef = doc(db, 'feedbackEval', tid, stage, essayId, 'feedback', commentId);
                    batch.set(feedbackRef, commentMeta, { merge: true });
                });

                if (!isCancelled) {
                    await batch.commit();
                    console.log("Finished writing essays and feedback!");
                    setData(essays);
                }
            } catch (error) {
                console.error('Error fetching CSV data:', error);
            }
        } else {
            setData(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})))
        }
        if (!isCancelled) {
            setLoading(false);
        }
    }

    fetchData();
    return () => {
        isCancelled = true; // Set the flag to true when the component unmounts or dependencies change
    };
  }, [tid]);


  const handleSelectDoc = (docId) => {
    if (docId != "") {
        router.push({
            pathname: '/editor',
            query: { tid, docId },
          });
    }
  };

  const handleNext = async () => {
    router.push({
        pathname: '/finish',
        query: { tid },
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-teal-400"></div>
        <p className="mb-4 mt-8 text-gray-700 text-left">Loading... If this takes longer than a minute, try going back or refreshing.</p>
        </div>
      </div>
    );
  } else {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans font-light text-sm">
            <div className="grid grid-col w-2/5">
            <div className="flex justify-center mb-4"> {/* Center the image */}
                    <div className="w-full max-w-xs"> {/* Adjust max-width as needed */}
                        <Image
                        src={"/stanford-gse.png"}
                        layout="responsive"
                        width={4}
                        height={3}
                        className="max-w-full h-auto"
                        alt="Stanford Graduate School of Education Logo"
                        />
                    </div>
                </div>
                <h1 className='text-3xl mb-4 p-4 text-gray-900 text-center'>Feedback Evaluation</h1>
            <p className="mb-4 text-gray-700 text-left">For this annotation task, you'll be evaluating characteristics of inline feedback comments on students' written work, using a codebook.</p>
            <p className="mb-10 text-gray-700 text-left">You'll review comments for each of the following essays. As you complete the annotations for the feedback comments in each essay, the buttons below will turn gray.</p>
            <div className="grid grid-cols-2 gap-4">
                {data.map(doc => (
                    <button key={doc.id} onClick={() => handleSelectDoc(doc.id)} className={`${doc.done ? "bg-[#767674]" : "bg-[#006B81]"} text-white p-2 rounded`}>
                        {doc.title}
                    </button>
                ))}
            </div>
            <p className="mt-10 text-gray-700 text-left">When you're finished, click this button to move on to the next evaluation task.</p>
            <button onClick={handleNext} className="mt-4 bg-[#006B81] text-white p-2 rounded text-base">
                Go to the Next Section
            </button>
            <p className="mb-4 mt-4 text-gray-400 text-left">If at any point you have questions, please email us at mxtan@stanford.edu.</p>   
            </div>
        </div>
    );
  }
};
