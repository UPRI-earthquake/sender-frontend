import React, { useState, useRef } from "react";
import { Button, Dialog, Toast } from 'primereact';
import { Form, FloatingLabel } from 'react-bootstrap';
import axios from "axios";

function DeviceLinkModal(props) {
	//FORM INPUT - DEVICE LINK
	const [inputUsername, setInputUsername] = useState('');
	const [inputPassword, setInputPassword] = useState('');
	const [macAddr, setMacAddress] = useState(null);
	const toast = useRef(null); //TOAST

	//HANDLE LINK FORM SUBMIT
	const handleDeviceLink = (event) => {
		event.preventDefault();

		axios.get('/mac')
			.then(res => setMacAddress(res.data))
			.catch(err => console.log(err))

		if(macAddr != null){
			axios.post('/accountInfo', {
				accountName: inputUsername,
				accountPassword: inputPassword,
				macAddress: macAddr
			})
			.then(res => console.log(res))
			.catch(err => console.log(err))

			setInputUsername('');
			setInputPassword('');
			toast.current.show({ 
				severity: 'success', 
				summary: 'Linking Success', 
				detail: 'MAC Address: ' + macAddr, 
				life: 3000 });
		}else {
			toast.current.show({ 
				severity: 'error', 
				summary: 'Linking Failed', 
				detail: 'Device MAC Address is not Acquired. Please try again.', 
				life: 3000 });
		}
	}

	const footerContent = (
		<div>
			<Button label="Cancel" icon="pi pi-times" rounded text raised onClick={props.close} className="p-button-text" />
			<Button label="Link" icon="pi pi-check" rounded onClick={handleDeviceLink} />
		</div>
	);



	return (
		<>
			<Toast ref={toast} onHide={() => window.location.reload()}></Toast>
			<Dialog header="Device-Account Link" visible={props.show} style={{ width: '50vw' }} onHide={props.close} draggable={false} resizable={false} footer={footerContent}>
				<FloatingLabel
					controlId="floatingInput"
					label="Username"
					className="mb-3">
					<Form.Control type="text"
						placeholder="Username"
						value={inputUsername}
						onChange={(e) => setInputUsername(e.target.value)}
						required={true}
						autoFocus />
				</FloatingLabel>
				<FloatingLabel controlId="floatingPassword" label="Password">
					<Form.Control type="password"
						placeholder="Password"
						value={inputPassword}
						onChange={(e) => setInputPassword(e.target.value)}
						required />
				</FloatingLabel>
			</Dialog>
		</>
	)
}

export default DeviceLinkModal;
