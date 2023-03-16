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
      <div className="nftUplodeBox p-10 border-2">
        <div className="imageLogoAndText">
          <p>Drag & drop images</p>
        </div>
        <input
          ref={ref}
          hidden
          multiple
          name="imageURL"
          type="file"
          accept=".jpg , .jpeg , .png"
        />
      </div>
      <p>OR</p>
      <button type="button" className="btn contained" onClick={selectFile}>
        Select File
        <input ref={ref} hidden type="file" accept=".jpg , .jpeg , .png" />
      </button>
    </div>
  );
}
