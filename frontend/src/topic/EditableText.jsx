import React, { useState } from "react";

function EditableText({ text, onSave }) {
  const [edit, setEdit] = useState(false);
  const [value, setValue] = useState(text);

  return edit ? (
    <>
      <textarea
        value={value}
        onChange={e=>setValue(e.target.value)}
      />
      <button onClick={()=>{
        onSave(value);
        setEdit(false);
      }}>Save</button>
    </>
  ) : (
    <>
      <p>{text}</p>
      <button onClick={()=>setEdit(true)}>Edit</button>
    </>
  );
}

export default EditableText;
