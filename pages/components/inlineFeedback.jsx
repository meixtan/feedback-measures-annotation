import { Box } from "@mui/material";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CommentContainer from "./commentContainer";
import HighlightedText from "./highlightedText";

const InlineFeedback = ({
  sourceDocId,
  sourceTid,
  sourceTextData,
  sourceCommentsData,
}) => {
  const [textData, setTextData] = useState(sourceTextData);
  const [docId, setDocId] = useState(sourceDocId);
  const [tid, setTid] = useState(sourceTid);
  const [currentCommentsData, setCurrentCommentsData] = useState(sourceCommentsData);
  const [annotatedTextData, setAnnotatedTextData] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentNodes, setCommentNodes] = useState([]);
  const annotatedTextContainerRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setCurrentCommentsData(sourceCommentsData);
    setTextData(sourceTextData);
    setDocId(sourceDocId);
  }, [sourceCommentsData, sourceTextData, sourceDocId]);

  useEffect(() => {
    const elements = [];
    let lastIndex = 0;
    currentCommentsData
      .sort((a, b) => a.startidx - b.startidx)
      .forEach((comment) => {
        const { startidx, endidx, commentId } = comment;
        if (startidx > lastIndex) {
          elements.push(textData.slice(lastIndex, startidx));
        }
        const isActive = String(commentId) === String(activeCommentId);
        elements.push(
          <HighlightedText
            key={`highlighted-text-${commentId}`}
            id={commentId}
            style={{ backgroundColor: isActive ? "#80cdda" : "#ffdb99", display: "inline" }}

            className="highlighted-text"
            data-start-index={startidx}
          >
            {textData.slice(Math.max(startidx, lastIndex), endidx)}
          </HighlightedText>
        );
        lastIndex = endidx;
      });
    if (lastIndex < textData.length) {
      elements.push(textData.slice(lastIndex));
    }
    setAnnotatedTextData(elements);
  }, [textData, currentCommentsData, activeCommentId]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    const container = annotatedTextContainerRef.current;
    if (!container) return;

    const parentRect = container.parentElement?.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const marginTop = parseFloat(window.getComputedStyle(container).marginTop || "0");

    // Step 1: get position + size of all comment boxes
    const positionedNodes = currentCommentsData.map((comment) => {
      const commentId = comment.commentId;
      const highlightEl = document.getElementById(commentId);
      if (!highlightEl) return null;

      const highlightRect = highlightEl.getBoundingClientRect();
      const top = highlightRect.top - containerRect.top + marginTop;
      const width = parentRect?.width ? parentRect.width - containerRect.width - 40 : 300;
      return {
        comment,
        top,
        width,
        height: 100, // placeholder; will adjust with ref if needed
      };
    }).filter(Boolean);

    // Step 2: adjust positions to prevent overlap
    const adjustedNodes = [];
    let lastBottom = 0;
    const gap = 10;

    for (let i = 0; i < positionedNodes.length; i++) {
      const { comment, top, width } = positionedNodes[i];
      const adjustedTop = Math.max(top, lastBottom + gap);
      lastBottom = adjustedTop + 100; // again, height placeholder
      const isActive = String(comment.commentId) === String(activeCommentId);

      adjustedNodes.push(
        <div
          key={`comment-box-${comment.commentId}`}
          id={`comment-box-${comment.commentId}`}
          className={`absolute p-2 rounded cursor-pointer transition-all duration-300 ${
            isActive ? "z-50 bg-[#e5f4f7] shadow-md" : "z-10 bg-white shadow-md"
          }`}
          style={{
            top: adjustedTop,
            width,
          }}
          onClick={() => setActiveCommentId(comment.commentId)}
        >
          <CommentContainer
            docId={docId}
            tid={tid}
            commentId={comment.commentId.toString()}
            startIndex={comment.startidx}
            endIndex={comment.endidx}
            text={comment.comment}
            savedComment={comment.comment}
            isNewComment={false}
          />
        </div>
      );
    }

    setCommentNodes(adjustedNodes);
  }, [currentCommentsData, annotatedTextData, activeCommentId, windowWidth]);

  return (
    <div style={{ display: "flex", gap: "5px" }}>
      <div
        ref={annotatedTextContainerRef}
        style={{ width: "70%", height: "100%",
          margin: "20px 0px 20px 20px",
          backgroundColor: "#F4F4F4",
          borderRadius: "5px",
        }}
      >
        <Box sx={{ padding: "20px" }}>
          <div style={{ minHeight: `${commentNodes.length * 110}px` }}>
            {annotatedTextData}
          </div>
        </Box>
      </div>
      <div
        ref={commentsContainerRef}
        className="relative"
        style={{
          position: "relative",
          overflow: "visible",
          width: "30%",
        }}
      >
        {commentNodes}
      </div>
    </div>
  );
};

export default InlineFeedback;
