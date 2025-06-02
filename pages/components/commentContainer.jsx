import {
  Box,
  Typography
} from "@mui/material";
import {
  useState
} from 'react';

const CommentContainer = ({
    docId,
    tid,
    commentId,
    startIndex,
    endIndex,
    text,
    savedComment,
    removeComment,
    isNewComment
}) => {
    const [comment, setComment] = useState(savedComment);
    const [isEditMode, setIsEditMode] = useState(false);
  
    return (
      <div
        style={{
          padding: "5px",
          display: "block",
        }}
      >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            </Box>
            <Box>
                <Typography variant="body2" display={"block"}
                    sx={{
                    paddingLeft: '2px',
                    color: '#43423E',
                    textAlign: 'left' // This is actually the default value, so it's optional to include
                  }}>
                  {comment}
                </Typography>
            </Box>
          </Box>
      </div>
    );
  };

export default CommentContainer;