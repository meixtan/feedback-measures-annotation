import {
  Box
} from "@mui/material";
import {
  useEffect,
  useRef,
  useState
} from "react";
import CommentContainer from "./commentContainer";
import HighlightedText from './highlightedText';


const InlineFeedback = ({
  sourceDocId,
  sourceTid,
  sourceTextData,
  sourceCommentsData,
}) => {
  const [annotatedTextData, setAnnotatedTextData] = useState([]);
  const [textData, setTextData] = useState(sourceTextData);
  const [docId, setDocId] = useState(sourceDocId);
  const [tid, setTid] = useState(sourceTid);
  const [commentNodes, setCommentNodes] = useState([]);
  const [commentsData, setCommentsData] =
    useState(sourceCommentsData);
  const commentsContainerRef = useRef(null);
  const annotatedTextContainerRef = useRef(null);
  const [currentSelectedCommentId, setCurrentSelectedCommentId] =
    useState("firstTime");
  const [windowWidth, setWindowWidth] = useState(0);

  const returnTextDataWithAnnotationMarks = (
    textData,
    commentsData,
  ) => {
    let workingTextData = textData;
    let elements = [];
    let lastIndex = 0;
    commentsData
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach((comment) => {
        const commentId = comment.commentId;
        if (!commentId) {
          return;
        }
        const commentStartIndex = comment.startidx;
        const commentEndIndex = comment.endidx;
  
        // Add the text before the comment
        if (commentStartIndex > lastIndex) {
          elements.push(workingTextData.slice(lastIndex, commentStartIndex));
        }

        // Highlight the non-overlapping part of the comment text
        elements.push(
          <HighlightedText
            key={`highlighted-text-${commentId}`}
            id={commentId}
            style={{ backgroundColor: '#80cdda', display: 'inline' }}
            data-start-index={Math.max(commentStartIndex, lastIndex)}
            className="highlighted-text"
          >
            {workingTextData.slice(
              Math.max(commentStartIndex, lastIndex),
              commentEndIndex
            )}
          </HighlightedText>
        );
  
        lastIndex = commentEndIndex;
      });
    // Add the remaining text after the last comment
    if (lastIndex < workingTextData.length) {
      elements.push(workingTextData.slice(lastIndex));
    }
    return (
      <div
        id="annotated-text-container"
        style={{ whiteSpace: "pre-wrap", fontFamily: "sans-serif", color: "#333333", // Dark gray color
        textAlign: "left" }}
        onMouseUp={(e) => {

          const selection = window.getSelection();
          if (selection) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const selectedText = range.cloneContents().textContent || "";
            if (selectedText.length > 0) {
              const startContainer = range.startContainer.parentNode;
              const endContainer = range.endContainer.parentNode;
  
              if (
                startContainer?.nodeName === "MARK" ||
                endContainer?.nodeName === "MARK"
              ) {
                alert("Overlapping comments are not supported");
                return;
              }
              let startIndex = range.startOffset;
  
              let node = range.startContainer;
              while (node && (node = node.previousSibling)) {
                startIndex += node.textContent ? node.textContent.length : 0;
              }
              let endIndex = startIndex + selectedText.length;
              onTextSelection &&
                rect
            }
          }
        }}
      >
        {elements.length > 0 ? elements : workingTextData}
      </div>
    );
  }

  const createCommentNodesWithCorrespondingToAnnotatedText = (
    docId,
    tid,
    commentsData,
    annotatedTextContainerRef,
  ) => {
    let commentNodes = [];
    commentsData.forEach((comment) => {
      const commentId = comment.commentId;
      const commentElement = document.getElementById(commentId);
  
      if (commentElement && annotatedTextContainerRef.current) {
        const annotatedTextContainer = annotatedTextContainerRef.current;
  
        const commentRect = commentElement.getBoundingClientRect();
        const annotatedTextContainerRect =
          annotatedTextContainer.getBoundingClientRect();
  
        const mainContainerRect =
          annotatedTextContainer?.parentElement?.getBoundingClientRect();
  
        let style = window.getComputedStyle(annotatedTextContainer);
        let marginTop = parseFloat(style.marginTop);
        let relativeTop =
          commentRect.top - annotatedTextContainerRect.top + marginTop;
  
        const annotatedTextContainerWidth = annotatedTextContainerRect.width;
  
        const mainContainerWidth = mainContainerRect?.width;
  
        const commentBoxWidth = mainContainerWidth
          ? mainContainerWidth - annotatedTextContainerWidth - 40
          : 0;
  
        commentNodes.push(
          <div
            key={`comment-box-${commentId}`}
            className="comment-box"
            data-start-index={comment.startidx}
            id={`comment-box-${commentId}`}
            style={{
              position: "absolute",
              backgroundColor: '#e5f4f7',
              padding: "5px",
              borderRadius: "5px",
              top: relativeTop,
              transition: "top 0.5s ease, box-shadow 0.5s ease, left 0.5s ease",
              width: commentBoxWidth,
            }}
          >
            <CommentContainer
              docId={docId}
              tid={tid}
              commentId={commentId.toString()}
              startIndex={comment.startidx}
              endIndex={comment.endidx}
              text={comment.comment}
              savedComment={comment.comment}
              isNewComment={false}
            />
          </div>
        );
      }
    });
  
    return commentNodes;
  }

  useEffect(() => {
    setCommentsData(sourceCommentsData);
    setTextData(sourceTextData)
    setDocId(sourceDocId)
  }, [sourceCommentsData, sourceTextData, sourceDocId]);

  useEffect(() => {
    const workingTextData = returnTextDataWithAnnotationMarks(
      textData,
      commentsData,
    );

    setAnnotatedTextData(workingTextData);
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    textData,
    commentsData,
  ]);

  useEffect(() => {
    const setUpCommentNodes = () => {
      const workingCommentNodes =
      createCommentNodesWithCorrespondingToAnnotatedText(
        docId,
        tid,
        commentsData,
        annotatedTextContainerRef,
      );
      setTimeout(() => {
        if (currentSelectedCommentId === "firstTime") {
          setCurrentSelectedCommentId(commentsData[0]?.commentId || "1");
        }
      }, 100);

      setCommentNodes(workingCommentNodes);
    }
    if (docId) setUpCommentNodes();
  }, [
    annotatedTextData,
    windowWidth,
    commentsData,
    currentSelectedCommentId,
  ]);

  useEffect(() => {
    if (commentNodes.length === 0) {
      return;
    }
  }, [commentNodes, currentSelectedCommentId]);

  const boxStyle = {
    padding: 1,
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "5px",
      }}
    >
      <div
        ref={annotatedTextContainerRef}
        style={{
          width: "70%",
          ...boxStyle,
          margin: "20px 0px 20px 20px",
          backgroundColor: "#F4F4F4",
          borderRadius: "5px"
        }}
      >
        <Box sx={{ margin: 0, padding: "20px", paddingBottom: "20px" }}>
          {annotatedTextData}
        </Box>
      </div>
      <div
        ref={commentsContainerRef}
        style={{
          ...boxStyle,
          position: "relative",
          overflow: "hidden",
          width: "30%",
        }}
      >
        {commentNodes}
      </div>
    </div>
  );
};

export default InlineFeedback;