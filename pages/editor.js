// components/options.js
import { Box } from "@mui/material";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDocumentData } from "react-firebase-hooks/firestore";
import DimensionAnnotations from "../lib/dimensionAnnotations";
import { hasUnanswered } from "../lib/dimensionQuestions";
import { db } from './api/firebase';
import InlineFeedback from './components/inlineFeedback';

export default function Editor() {
    const router = useRouter();
    const { tid, docId } = router.query;

    const [commentsData, setCommentsData] = useState([]);
    const [selectedComment, setSelectedComment] = useState(null);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [splitComment, setSplitComment] = useState(false);
    const [commentSplit1, setCommentSplit1] = useState("");
    const [commentSplit2, setCommentSplit2] = useState("");
    const [wholeCommentAnnotationData, setWholeCommentAnnotationData] = useState({});
    const [split1AnnotationData, setSplit1AnnotationData] = useState({});
    const [split2AnnotationData, setSplit2AnnotationData] = useState({});

    const stage = process.env.NEXT_PUBLIC_STAGE;
    const docRef = docId ? doc(db, 'feedbackEval', tid, stage, docId) : null;
    const [value, loading, error] = useDocumentData(docRef ? docRef : undefined);

    useEffect(() => {
        const fetchComments = async() => {
          // get all inline comments
          let comments = [];
          const colRef = collection(db, 'feedbackEval', tid, stage, docId, 'feedback');
          // filter out the empty comments
          const comments_query = query(colRef, orderBy('startidx'), where('comment', '!=', ""));
          const comments_snap = await getDocs(comments_query);
          console.log("docs fetched")
          comments_snap.forEach((doc) => {
              comments.push({commentId: doc.id, ...doc.data()});
          });
          setCommentsData(comments);
          const firstComment = comments[0]
          setSelectedComment(firstComment) // default to the first comment
          setCommentsLoading(false);
        }

        if (tid && docId && value) fetchComments(); 
    }, [tid, docId, value])

    const resetState = () => {
      setSplitComment(false);
      setCommentSplit1("");
      setCommentSplit2("");
      setWholeCommentAnnotationData({});
      setSplit1AnnotationData({});
      setSplit2AnnotationData({});
    }

    useEffect(() => {
      const fetchAnnotations = async() => {
        console.log("fetching annotations")
        resetState();
        // for the selected comment, read if we've already annotated it
        const commentRef = doc(db, 'feedbackEval', tid, stage, docId, 'feedback', selectedComment.commentId);
        const split1Ref = doc(commentRef, 'splits', 'split1');
        const split1Snap = await getDoc(split1Ref);
        if (split1Snap.exists()) {
          const split1Data = split1Snap.data();
          // if split2 exists, this is a split annotation
          const split2Ref = doc(commentRef, 'splits', 'split2');
          const split2Snap = await getDoc(split2Ref);
          if (split2Snap.exists()) {
            const split2Data = split2Snap.data();
            setSplitComment(true);
            setCommentSplit1(split1Data.text || "");
            setCommentSplit2(split2Data.text || "");
            setSplit1AnnotationData(split1Data);
            setSplit2AnnotationData(split2Data);
          } else {
            setSplitComment(false);
            setWholeCommentAnnotationData(split1Data);
          }
        }
      }

      if (selectedComment) fetchAnnotations();
      
    }, [selectedComment])
    
    const isValid = () => {
      const valid = splitComment
        ? commentSplit1.trim() !== "" &&
          commentSplit2.trim() !== "" &&
          !hasUnanswered(split1AnnotationData) &&
          !hasUnanswered(split2AnnotationData)
        : !hasUnanswered(wholeCommentAnnotationData);
      return valid;
    };

    const handleSaveAndNext = async () => {
      setSaveError("");
      setSaveLoading(true);
      // Check for unanswered questions
      const batch = writeBatch(db);
      if (!isValid()) {
        setSaveError("Please complete all annotation fields before saving!");
        setSaveLoading(false);
        return;
      }
      if (splitComment) {
          const split1Ref = doc(db, 'feedbackEval', tid, stage, docId, 'feedback', selectedComment.commentId, 'splits', 'split1');
          const split1Meta = {
            ...split1AnnotationData,
            text: commentSplit1
          };
          batch.set(split1Ref, split1Meta, { merge: true });
          const split2Ref = doc(db, 'feedbackEval', tid, stage, docId, 'feedback', selectedComment.commentId, 'splits', 'split2');
          const split2Meta = {
            ...split2AnnotationData,
            text: commentSplit2
          };
          batch.set(split2Ref, split2Meta, { merge: true });
          await batch.commit();
      } else {
        const commentRef = doc(db, 'feedbackEval', tid, stage, docId, 'feedback', selectedComment.commentId, 'splits', 'split1');
        const commentMeta = {
          ...wholeCommentAnnotationData,
          text: selectedComment.comment
        };
        batch.set(commentRef, commentMeta, { merge: true });
        await batch.commit();
      }
      setSaveLoading(false);

      const currentIndex = commentsData.findIndex(
        (c) => c.commentId === selectedComment.commentId
      );
    
      if (currentIndex >= 0 && currentIndex < commentsData.length - 1) {
        setSelectedComment(commentsData[currentIndex + 1]);
        setSaveError("");
        resetState();
      } else {
        setSaveError("You're at the last comment already! Head back to the previous page to start on another essay :)");
      }
    };

    const handleExit = async () => {
      router.push({
          pathname: '/essays',
          query: { tid },
      });
    }

    const handleMarkComplete = async() => {
      const update = {
        done: true
      }
      await setDoc(docRef, update, {merge: true});
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
            <p className="mb-4 ml-4 text-gray-700 text-left">Click each of the numbered buttons below to view the feedback comments for this essay. For each comment, answer the annotation questions below.</p>
          
            <div className="mt-4 ml-4 bg-[#e5f4f7] rounded">
              <p className="p-2 text-gray-700 text-left italic">Assignment Instructions: {value.assignment}</p>
            </div>

            <div className="mt-4 ml-4 bg-[#dbe0c3] rounded">
              <p className="p-2 text-gray-700 text-left italic">Grade Level: {value.grade}</p>
            </div>

            <div className="ml-4 mt-4 space-y-2">
              {commentsData.map((comment, index) => (
                <button
                  key={comment.commentId}
                  onClick={() => setSelectedComment(comment)}
                  className={`mr-2 px-4 py-2 border rounded ${
                    selectedComment === comment
                      ? 'bg-[#e5f4f7]'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {index}
                </button>
              ))}
            </div>
          {!value.done && (
              <button key="complete"
              onClick = {() => handleMarkComplete()}
              className={`ml-4 mt-4 px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200`}>
                {"Mark this essay complete!"}
            </button>
            )
          }
          
          <Box display={"flex"} flexDirection={"column"}>
            <Box sx={{ mt: 2, mb: 1 }}>
              <InlineFeedback
                sourceDocId={docId}
                sourceTid={tid}
                sourceTextData={value.essay}
                sourceCommentsData={selectedComment ? [selectedComment] : []}
                />
              <p className="mt-2 ml-4 text-gray-700 text-left">Would it be easier to annotate this comment if it were split up?</p>
              <button
                  key={'split'}
                  onClick={() => setSplitComment(true)}
                  className={`ml-4 mt-2 px-4 py-2 border rounded ${
                    splitComment === true
                      ? 'bg-[#e5f4f7]'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {"Yes, split it up."}
              </button>
              <button
                key={'nosplit'}
                onClick={() => setSplitComment(false)}
                className={`mr-2 ml-2 mt-2 px-4 py-2 border rounded ${
                  splitComment === false
                    ? 'bg-[#e5f4f7]'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {"No, keep it together."}
              </button>
              {splitComment === false ? (
                <DimensionAnnotations
                  answers={wholeCommentAnnotationData}
                  onAnswersChange={setWholeCommentAnnotationData}
                />
              ) : (
                <div className="ml-4 mt-4"> 
                  <input
                    type="text"
                    id="chunk1"
                    value={commentSplit1}
                    onChange={(e) => setCommentSplit1(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                    placeholder="Type or paste the first chunk of the feedback here..."
                  />
                  <DimensionAnnotations
                    instance={"split1"}
                    answers={split1AnnotationData}
                    onAnswersChange={setSplit1AnnotationData}
                  />
                  <input
                    type="text"
                    id="chunk2"
                    value={commentSplit2}
                    onChange={(e) => setCommentSplit2(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                    placeholder="Type or paste the second chunk of the feedback here..."
                  />
                  <DimensionAnnotations
                    instance={"split2"}
                    answers={split2AnnotationData}
                    onAnswersChange={setSplit2AnnotationData}
                  />
                </div>
              )}
              <button onClick={handleSaveAndNext} 
                  className={`ml-4 px-4 mt-2 py-2 border rounded text-white bg-[#006B81]`}>
                  Save & Go to the Next Comment
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

