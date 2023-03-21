import React, { useState, useRef } from "react";
import { Button, Dialog, Toast } from 'primereact';
import { Form, FloatingLabel } from 'react-bootstrap';
import axios from 'axios';

function AddServerModal(props) {
  //FORM INPUT - ADD NEW SERVER
  const [inputUrl, setInputUrl] = useState('');
  const [inputHostName, setInputHostName] = useState('');
  const toast = useRef(null); //TOAST

  //HANDLE ADD SERVER FORM SUBMIT
  const handleAddServerSubmit = (event) => {
    event.preventDefault();

    axios.post('/servers', {
			hostName: inputHostName,
			url: inputUrl,
      isConnected: false
		})
		.then(res => console.log(res))
		.catch(err => console.log(err))

    setInputUrl('');
    setInputHostName('');
    toast.current.show({ severity: 'success', summary: 'Add New Server Success', detail: 'New Server Added', life: 3000 });
  }

  const footerContent = (
    <div>
      <Button label="Cancel"
        icon="pi pi-times"
        onClick={props.close}
        rounded text raised
        className="p-button-text" />
      <Button label="Add Server"
        severity="info"
        icon="pi pi-check"
        rounded
        onClick={handleAddServerSubmit} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} onHide={() => window.location.reload(true)}></Toast>

      <Dialog header="Add New Server" visible={props.show} style={{ width: '50vw' }} onHide={props.close} draggable={false} resizable={false} footer={footerContent}>
        <FloatingLabel controlId="floatingUrl" label="URL">
          <Form.Control
            type="text"
            placeholder="ServerUrl"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            autoFocus />
        </FloatingLabel><br></br>

        <FloatingLabel controlId="serverName" label="ServerName">
          <Form.Control
            type="text"
            placeholder="ServerUrl"
            value={inputHostName}
            onChange={(e) => setInputHostName(e.target.value)} />
        </FloatingLabel>
      </Dialog>

    </>
  )
}

export default AddServerModal;
