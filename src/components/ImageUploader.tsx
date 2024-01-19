import React, { FC, RefObject, useState } from "react";

type Props = {
  _ref: RefObject<HTMLInputElement>;
};
export const ImageUploader: FC<Props> = ({ _ref: ref }) => {
  const [image,setImage] = useState<FileList[number]>()
  const selectFile = () => {
    if(!ref.current) return
    ref.current.click()
    ref.current.onchange = (ev:any) => {
      setImage(ev.target.files[0]);
    }
  }
  return (
    <div className="my-4">
      {(ref.current?.files?.length || 0) > 0 && (
        <div className="flex justify-center">
          <img src={URL.createObjectURL(image as any)} alt="nft" className="border-2 my-1" />
        </div>
      )}
      {/* <div className="p-10 border-2 relative">
        <div>
          <p>Drag & drop images</p>
        </div>
        <input
          ref={ref}
          name="imageInput"
          className="hidden"
          multiple
          type="file"
          accept=".jpg , .jpeg , .png"
        />
      </div>
      <p>OR</p> */}
      <button
        type="button"
        className="btn relative contained"
        onClick={selectFile}
      >
        Select File
        <input
          ref={ref}
          name="imageInput"
          className="hidden"
          type="file"
          accept=".jpg , .jpeg , .png"
        />
      </button>
    </div>
  );
}
