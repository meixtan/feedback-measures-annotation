// components/options.js
import { Box } from "@mui/material";
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDocumentData } from "react-firebase-hooks/firestore";
import { fetchCsv } from '../lib/parsecsv';
import { db } from './api/firebase';
import InlineFeedback from './components/inlineFeedback';

export default function Selector() {
    const router = useRouter();
    const { tid, access, docId } = router.query;
    const [essay, setEssay] = useState("");
    const [instructions, setInstructions] = useState("");
    const [grade, setGrade] = useState("");
    const [tid1Comments, setTid1Comments] = useState([]);
    const [tid2Comments, setTid2Comments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [preference, setPreference] = useState(1);

    const docRef = docId ? doc(db, 'feedbackEval', tid, 'preferences', docId) : null;
    const [value, loading, error] = useDocumentData(docRef ? docRef : undefined);

    useEffect(() => {
        if (!tid) {
            return;
        }
        const fetchComments = async() => {
            setCommentsLoading(true)
            const csvData = await fetchCsv('pairs_essays.csv');
            const matchedData = csvData.filter(row => row.new_essay_id === docId)
            console.log(matchedData)

            const tid1rows = csvData.filter(row => row.new_essay_id === docId && row.tid === value.tid1);
            const tid2rows = csvData.filter(row => row.new_essay_id === docId && row.tid === value.tid2);

            const tid1commentsload = []
            tid1rows.forEach(row => {
                const commentMeta = {
                    excerpt: row['excerpt'],
                    comment: row['comment'],
                    startidx: Number(row['startidx']),
                    endidx: Number(row['endidx']),
                    commentId: row['comment_id']
                }
                tid1commentsload.push(commentMeta);
            })
            setTid1Comments(tid1commentsload);

            const tid2commentsload = []
            tid2rows.forEach(row => {
                const commentMeta = {
                    excerpt: row['excerpt'],
                    comment: row['comment'],
                    startidx: Number(row['startidx']),
                    endidx: Number(row['endidx']),
                    commentId: row['comment_id']
                }
                tid2commentsload.push(commentMeta);
            })
            setTid2Comments(tid2commentsload);
            console.log('finished loading')
            console.log(tid1Comments)
            setCommentsLoading(false);
        }

        if (tid && docId && value) fetchComments(); 
    }, [tid, docId, value])

    const handleSaveAndNext = async () => {
      setSaveLoading(true);
      const update = {
        done: true,
        preference: preference
      }
      await setDoc(docRef, update, {merge: true});
      const colRef = collection(db, 'feedbackEval', tid, "preferences");
      const querySnapshot = await getDocs(colRef);
      const alldocs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      const docs = alldocs.filter(doc => doc.done !== true);
      console.log(docs)
      const selectedDoc = docs[0];
      if (selectedDoc) {
        router.push({
          pathname: '/selector',
          query: {
              tid,
              access,
              docId: selectedDoc.essayid,
          },
        });
      } else {
        router.push({
          pathname: '/preference',
          query: {
              tid,
              access,
          },
        });
      }
      
      setSaveLoading(false);
    };

    const handleExit = async () => {
      router.push({
        pathname: '/preference',
        query: {
            tid,
            access,
        },
      });
    }

    if (loading || commentsLoading || saveLoading || !value) {
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
          <div className="w-3/5">
            <p className="text-3xl mt-20 mb-2 p-4 text-gray-900 text-center">{value.title}</p>
            <p className="mb-4 ml-4 text-gray-700 text-left">Toggle the two buttons below to view each of the two sets of feedback. Determine which set better helps the student to revise. Keep your chosen set selected and click the button at the bottom to save your choice.</p>
          
            <div className="mt-4 ml-4 bg-[#e5f4f7] rounded">
              <p className="p-2 text-gray-700 text-left italic">Assignment Instructions: {value.instructions}</p>
            </div>

            <div className="mt-4 ml-4 bg-[#dbe0c3] rounded">
              <p className="p-2 text-gray-700 text-left italic">Grade Level: {value.grade}</p>
            </div>

            <div className="ml-4 mt-4 space-y-2">
                <button
                  key={'set1'}
                  onClick={() => setPreference(1)}
                  className={`mr-2 px-4 py-2 border rounded ${
                    preference == 1
                      ? 'bg-[#006B81] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {'Feedback Set #1'}
                </button>
                <button
                  key={'set2'}
                  onClick={() => setPreference(2)}
                  className={`mr-2 px-4 py-2 border rounded ${
                    preference == 2
                      ? 'bg-[#006B81] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {'Feedback Set #2'}
                </button>
            </div>
          
          <Box display={"flex"} flexDirection={"column"}>
            <Box sx={{ mt: 2, mb: 1 }}>
              <InlineFeedback
                sourceDocId={docId}
                sourceTid={tid}
                sourceTextData={value.essay}
                sourceCommentsData={preference == 1 ? tid1Comments : tid2Comments}
                />

              <button onClick={handleSaveAndNext} 
                  className={`ml-4 px-4 mt-2 py-2 border rounded text-white bg-[#006B81]`}>
                  Prefer This Set & Go To Next Choice
              </button>
              <button onClick={handleExit} 
                  className={`ml-4 px-4 mt-2 py-2 border rounded bg-gray-100`}>
                  Exit this Essay
              </button>
              {saveLoading && (<p className="ml-4 mt-2 mb-10 text-gray-400 text-left">{'Saving...'}</p> )}
              <p className="ml-4 mt-2 mb-10 text-[#C74632] text-left">{saveError}</p> 
            </Box>
            
          </Box>
          
          </div>
      </div>
      );
    }
};

