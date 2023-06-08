import React, { useState, useRef } from "react";
import { Button, Dialog, Toast, Tooltip, InputText } from 'primereact';
import axios from 'axios';
import styles from './Modal.module.css'

function AddServerModal(props) {
  //FORM INPUT - ADD NEW SERVER
  const [inputUrl, setInputUrl] = useState('');
  const [inputHostName, setInputHostName] = useState('');
  const toast = useRef(null); //TOAST

  //HANDLE ADD SERVER FORM SUBMIT
  const handleAddServerSubmit = async (event) => {
    event.preventDefault();

    try {
      // Make a POST request to the server using Axios
      const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
      const response = await axios.post(`${backend_host}/servers/add`, {
        hostName: inputHostName,
        url: inputUrl,
      });

      console.log(response);
      setInputUrl('');
      setInputHostName('');

      toast.current.show({
        severity: 'success',
        summary: 'Add New Server Success',
        detail: 'New Server Added',
        life: 3000
      });

      // Call onAddServer prop
      props.onAddServer();
      props.close();
    } catch (error) {
      console.log(error);
			let errorSummary = "";

			if (error.code === "ERR_NETWORK") {
				errorSummary += error.message;
			} else if (error.response.data.message) {
				errorSummary += error.response.data.message;
			}

      toast.current.show({
        severity: 'error',
        summary: 'Add New Server Error',
        detail: errorSummary,
        life: 3000,
      });
    }
  };

  const footerContent = (
    <div>
      <Tooltip target=".submitBtn"></Tooltip>
      <Button 
        label="Cancel"
        icon="pi pi-times"
        onClick={props.close}
        text raised
        className="p-button-text" />
      <Button 
        className="submitBtn"
        data-pr-tooltip="Submit Form"
        data-pr-position="bottom"
        label="Add Server"
        severity="info"
        icon="pi pi-check"
        onClick={handleAddServerSubmit} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} ></Toast>

      <Dialog
        header="Add New Server"
        visible={props.show}
        style={{ width: '25vw' }}
        onHide={props.close}
        draggable={false}
        resizable={false}
        footer={footerContent}
      >
        <div className="p-dialog-center p-fluid">
          <form>
            <div className={styles.inputField}>
              <span className="p-float-label">
                <InputText
                  id="urlInput"
                  data-pr-tooltip="Input the URL of the ringserver you want to connect to here"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  autoFocus
                />
                <label htmlFor="urlInput">Server URL</label>
                <Tooltip target="#urlInput"></Tooltip>
              </span>
            </div>

            <div className={styles.inputField}>
              <span className="p-float-label">
                <InputText
                  id="hostNameInput"
                  data-pr-tooltip="Input the server alias here"
                  value={inputHostName}
                  onChange={(e) => setInputHostName(e.target.value)}
                />
                <label htmlFor="hostNameInput">Host Name</label>
                <Tooltip target="#hostNameInput"></Tooltip>
              </span>
            </div>

          </form>
        </div>
      </Dialog>

    </>
  )
}

export default AddServerModal;
