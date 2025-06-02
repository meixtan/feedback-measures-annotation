import React from 'react';

const YNRadio = ({selectedValue, onValueChange}) => {

  // Handler function to update state
  const handleChange = (event) => {
    onValueChange(event.target.value);
  };

  return (
    <div>
      <form style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <p className="text-gray-700" style={{ margin: 0 }}>Does this essay look like something students at your school might write?</p>
        <label style={{ display: 'flex', alignItems: 'center', color: '#43423E' }}>
          Yes
          <input
            type="radio"
            value="yes"
            name="essayQuestion"
            checked={selectedValue === 'yes'}
            onChange={handleChange}
            style={{ marginLeft: '5px', accentColor: '#009AB4' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', color: '#43423E' }}>
          No
          <input
            type="radio"
            value="no"
            name="essayQuestion"
            checked={selectedValue === 'no'}
            onChange={handleChange}
            style={{ marginLeft: '5px', accentColor: '#009AB4' }}
          />
        </label>
      </form>
    </div>
  );
};

export default YNRadio;
