import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { default as React } from 'react';

const CommentMenuButton = ({
    editAction,
    deleteAction,
  }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
  
    return (
      <div>
        <IconButton
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <MenuItem
            onClick={() => {
              editAction();
              handleClose();
            }}
          >
            Edit
          </MenuItem>
        </Menu>
      </div>
    );
  };

export default CommentMenuButton;
