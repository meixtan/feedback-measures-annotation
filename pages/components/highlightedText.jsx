import React from 'react';

const HighlightedText = ({ children, ...props }) => {
    return <mark {...props}>{children}</mark>;
  };

export default HighlightedText;
