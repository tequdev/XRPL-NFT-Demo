import { FC, RefObject } from "react";

type Props = {
  _ref: RefObject<HTMLInputElement>;
};
export const ImageUploader: FC<Props> = ({ _ref: ref }) => {
  const selectFile = () => {
    ref.current?.click()
  }
  return (
    <div className="my-4">
      <div className="p-10 border-2 relative">
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
      <p>OR</p>
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
