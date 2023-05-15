import React, { useState, useRef } from "react";
import { Button, Dialog, Toast, Tooltip } from 'primereact';
import { Form, FloatingLabel } from 'react-bootstrap';
import axios from 'axios';

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
      const response = await axios.post('http://10.10.7.181:5001/servers/add', {
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

      toast.current.show({
        severity: 'error',
        summary: 'Add New Server Error',
        detail: error.response.data.message,
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
        rounded text raised
        className="p-button-text" />
      <Button 
        className="submitBtn"
        data-pr-tooltip="Submit Form"
        data-pr-position="bottom"
        label="Add Server"
        severity="info"
        icon="pi pi-check"
        rounded
        onClick={handleAddServerSubmit} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} ></Toast>

      <Dialog 
        header="Add New Server" 
        visible={props.show} 
        style={{ width: '50vw' }} 
        onHide={props.close} 
        draggable={false} 
        resizable={false} 
        footer={footerContent}
      >
        <FloatingLabel controlId="floatingUrl" label="Server URL - https://example.com">
          <Tooltip target=".urlInput"></Tooltip>
          <Form.Control
            className="urlInput"
            data-pr-tooltip="Input the URL of the ringserver you want to connect to here"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            autoFocus />
        </FloatingLabel><br></br>

        <FloatingLabel controlId="serverName" label="Host Name">
          <Tooltip target=".hostNameInput"></Tooltip>
          <Form.Control
            className="hostNameInput"
            data-pr-tooltip="Input the server alias here"
            type="text"
            value={inputHostName}
            onChange={(e) => setInputHostName(e.target.value)} />
        </FloatingLabel>
      </Dialog>

    </>
  )
}

export default AddServerModal;
