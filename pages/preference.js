// components/options.js
import { collection, doc, getDocs, orderBy, query, writeBatch } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchCsv } from '../lib/parsecsv';
import { db } from './api/firebase';

export default function Preference() {
  const router = useRouter();
  const [data, setData] = useState([]);
  
  const { tid, access } = router.query;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tid) {
        return;
    }

    let isCancelled = false;

    async function fetchData() {
        setLoading(true)
        const group = parseInt(access.match(/\d+$/)[0], 10) + 1; 
        console.log(group);
        const colRef = collection(db, 'feedbackEval', tid, "preferences");
        const q = query(colRef, orderBy('index'));
        const querySnapshot = await getDocs(q);
        console.log(querySnapshot.docs)
        if (isCancelled) return;

        if (querySnapshot.empty) {
            try {
                const filepath = 'pairs.csv';
                const csvData = await fetchCsv(filepath);
                const data = csvData.filter(row => parseInt(row.group, 10) === group);
                console.log(`Filtered rows: ${data.length}`);
                const batch = writeBatch(db);
                const essays = [];
                let essayCount = 0;
                data.forEach(row => {
                    const essayId = row['new_essay_id'];
                    if (!essayId || essayId.trim() === '') {
                        console.warn('Skipping row with blank essay_id:', row);
                        return; // skip this row
                    }
                    essayCount += 1;
                      const essayMeta = {
                        essay: row['essay'],
                        essayid: row['new_essay_id'],
                        instructions: row['instructions'],
                        grade: row['grade'],
                        tid1: row['tid1'],
                        tid2: row['tid2'],
                        match_type: row['match_type'],
                        title: `Essay ${essayCount}`,
                        index: essayCount
                      };
                      const essayDocRef = doc(db, 'feedbackEval', tid, "preferences", essayId);
                      batch.set(essayDocRef, essayMeta, { merge: true });
                      essays.push({id: essayId, ...essayMeta})
                });

                if (!isCancelled) {
                    await batch.commit();
                    console.log("Finished writing essays and pair data!");
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
        const doc = data.find(d => d.id === docId);
        if (doc) {
        router.push({
            pathname: '/selector',
            query: {
                tid,
                access,
                docId,
                tid1: doc.tid1,
                tid2: doc.tid2,
            },
        });
        } else {
            console.error("Document not found");
        }
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
                <h1 className='text-3xl mb-4 p-4 text-gray-900 text-center'>Feedback Preferences</h1>
            <p className="mb-4 text-gray-700 text-left">For this annotation task, you'll select which of two sets of feedback comments better helps the student revise their work.</p>
            <p className="mb-10 text-gray-700 text-left">You'll choose between two sets of comments for each of the following essays. As you complete the preference annotations for each essay, the buttons below will turn gray. (Don't despair! There are a lot of buttons but this one goes by fast!)</p>
            <div className="grid grid-cols-4 gap-4">
                {data.map((doc, index) => (
                    <button key={`${doc.id}-${index}`} onClick={() => handleSelectDoc(doc.id)} className={`${doc.done ? "bg-[#767674]" : "bg-[#006B81]"} text-white p-2 rounded`}>
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
