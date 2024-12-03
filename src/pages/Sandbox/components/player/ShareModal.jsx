import React, { useContext, useState } from "react";
import styles from "../../styles/player/_ShareModal.module.scss";
import { ReactSVG } from "react-svg";

// Context
import { ContentStateContext } from "../../context/ContentState";

import localforage from "localforage";

localforage.config({
  driver: localforage.INDEXEDDB,
  name: "Chrome Video Recorder",
  version: 1,
});

const shareLinksStore = localforage.createInstance({
  name: "shareLinks",
});

// Get chunks store
const chunksStore = localforage.createInstance({
  name: "chunks",
});

const ShareModal = ({ showShare, setShowShare }) => {
  const [contentState, setContentState] = useContext(ContentStateContext); // Access the ContentState context
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    uploadMessage: "",
    fileUrl: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const uploadUrl = "https://us-central1-webinarstvus.cloudfunctions.net/storefile/upload";
  const maxChunkSize = 32000 * 1024; // 32 MB limit

const uploadChunks = async () => {
  try {
    console.log("uploadChunks function called");
    setUploadState({ ...uploadState, isUploading: true, progress: 0, uploadMessage: "Uploading..." });

    console.log(uploadState);

    const chunkArray = [];
    await chunksStore.iterate((value) => {
      chunkArray.push(value.chunk);
    });
    console.log(chunkArray);

    const blob = new Blob(chunkArray, { type: "video/webm" });
    const totalBytes = blob.size; // Total file size
    const buf = new Uint8Array(await blob.arrayBuffer());
    let uploadedBytes = 0; // Tracks the uploaded bytes
    let id = null;
    let i = 0;

    const uploadChunk = async () => {
      console.log("uploadChunk called");
      const isLastChunk = i + maxChunkSize >= buf.length;
      const fd = new FormData();
      if (id) {
        fd.append("id", id);
      }
      fd.append("filename", "recording.webm");
      fd.append("last", isLastChunk ? "true" : "false");
      fd.append("data", new Blob([buf.subarray(i, i + maxChunkSize)]));

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

    

      if (data.url) {
        const shareData = {
          url: data.url,
          title: `C.V.R ${new Date().toISOString()}`, // Replace with actual title if available
          date: new Date().toISOString(), // Optional timestamp
        };

        await shareLinksStore.setItem(shareData.title, shareData);

        setUploadState({
          isUploading: false,
          progress: 100,
          uploadMessage: "Upload Complete!",
          fileUrl: data.url,
        });
      } else if (data.id) {
        id = data.id;
        uploadedBytes += maxChunkSize; // Increment uploaded bytes
        i += maxChunkSize;

        setUploadState((prev) => ({
          ...prev,
          progress: Math.min((uploadedBytes / totalBytes) * 100, 99), // Update progress
        }));

        await uploadChunk();
      } else {
        throw new Error("Invalid response from server");
      }
    };

    await uploadChunk();
  } catch (error) {
    setUploadState({
      ...uploadState,
      isUploading: false,
      uploadMessage: "Upload failed. Please try again.",
    });
    console.error("Upload failed:", error);
  }
};
  return (
    <div className={styles.modalWrap}>
      <div className={styles.modal}>
        <div
          className={styles.close}
          onClick={() => {
            setShowShare(false);
          }}
        >
          <ReactSVG
            src="/assets/editor/icons/close-button.svg"
            width="16px"
            height="16px"
          />
        </div>
        {uploadState.fileUrl ? (
          <>
            <div className={styles.title}>Upload Complete</div>
            <div className={styles.subtitle}>
              Here is the URL to the recording. <br/> NOTE: It will only be available for 1 week.
            </div>
            <div className={styles.urlContainer}>
              <input
                type="text"
                value={uploadState.fileUrl}
                readOnly
                className={styles.urlInput}
              />
              <div
                className={styles.copyIcon}
                onClick={() => {
                  navigator.clipboard.writeText(uploadState.fileUrl);
                  alert("URL copied to clipboard!");
                }}
              >
                <ReactSVG
                  src="/assets/editor/icons/copy-link.svg"
                  width="16px"
                  height="16px"
                />
              </div>
            </div>

          </>
        ) : uploadState.isUploading ? (
          <>
  <style>
    {`
      #myProgress {
        width: 350px;
        max-width: 400px;
        background: #F4F4F4;
        box-shadow: inset -1px 1px 2px rgba(200, 200, 200, 0.2), inset 1px -1px 2px rgba(200, 200, 200, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 0.9), inset 1px 1px 3px rgba(200, 200, 200, 0.9);
        border-radius: 28px;
        overflow: hidden;
      }

      #myBar {
        width: 10%;
        height: 20px;
        background: rgba(0, 209, 0, 0.35);
        border-radius: 28px;
        text-align: center;
        line-height: 30px;
        color: white;
        transition: 0.5s;
        animation: loading82341 10s ease infinite;
      }

      @keyframes loading82341 {
        0% { width: 0%; }
        10% { width: 10%; }
        50% { width: 40%; }
        60% { width: 60%; }
        100% { width: 100%; }
      }
    `}
  </style>
  <div className={styles.title}>Your video is uploading...</div>
  <div id="myProgress">
    <div id="myBar"></div>
  </div>
</>
        ) : (
          <>
            <div className={styles.title}>
              Do you want this recording stored in the cloud?
            </div>
            <div className={styles.subtitle}>
              It will be available for 1 week.
            </div>
            <div className={styles.buttonRow}>
              <div className={styles.button} onClick={uploadChunks}>
                Yes
              </div>
              <div
                className={styles.button}
                onClick={() => setShowShare(false)}
              >
                No
              </div>
            </div>
          </>
        )}
      </div>
      <div
        className={styles.modalBackground}
        onClick={() => {
          setShowShare(false);
        }}
      ></div>
    </div>
  );
};

export default ShareModal;
