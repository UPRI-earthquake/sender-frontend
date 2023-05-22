import React, { useState, useRef } from "react";
import { Button, Dialog, Toast, Tooltip } from 'primereact';
import { Form, FloatingLabel } from 'react-bootstrap';
import axios from "axios";

function DeviceLinkModal(props) {
	//FORM INPUT - DEVICE LINK
	const [inputUsername, setInputUsername] = useState('');
	const [inputPassword, setInputPassword] = useState('');
	const toast = useRef(null); //TOAST

	//HANDLE LINK FORM SUBMIT
	const handleDeviceLink = async (event) => {
		event.preventDefault();

		try {
			const backend_host = process.env.REACT_APP_BACKEND_DEV
			await axios.post(`${backend_host}/deviceLinkRequest`, {
				username: inputUsername,
				password: inputPassword
			});

			setInputUsername('');
			setInputPassword('');
			toast.current.show({
				severity: 'success',
				summary: 'Linking Success',
				detail: 'Device Link Request Successful',
				life: 3000
			});

			// Call onLinkingSuccess prop
			props.onLinkingSuccess();
			props.close();

		} catch (error) {
			console.log(error);
			let errorSummary = "";

			if (error.code === "ERR_NETWORK") {
				errorSummary += error.message;
			} else if (error.response.data.validationErrors) {
				error.response.data.validationErrors.forEach(error => {
					errorSummary += error.msg + ", \n";
				});
			} else if (error.response.data.message) {
				errorSummary += error.response.data.message;
			}

			toast.current.show({
				severity: 'error',
				summary: 'Device Linking Failed',
				detail: errorSummary,
				life: 3000
			});
		}
	}
	  

	const footerContent = (
		<div>
			<Tooltip target=".submitBtn"></Tooltip>
			<Button 
				label="Cancel" 
				icon="pi pi-times"  
				text 
				raised 
				onClick={props.close} 
				className="p-button-text" />
			<Button 
				className="submitBtn"
				data-pr-tooltip="Submit Form"
				data-pr-position="bottom"
				label="Link" 
				icon="pi pi-check"  
				onClick={handleDeviceLink} />
		</div>
	);

	const hideModal = () => {
		setInputUsername('');
		setInputPassword('');
		props.close()
	}



	return (
		<>
			<Toast ref={toast} ></Toast>
			<Dialog header="Device-Account Link" visible={props.show} style={{ width: '50vw' }} onHide={hideModal} draggable={false} resizable={false} footer={footerContent}>
				<Tooltip target=".usernameInput"></Tooltip>
				<FloatingLabel
					controlId="floatingInput"
					label="Username"
					className="mb-3">
					<Form.Control 
						className="usernameInput"
						data-pr-tooltip="Input the username you register from the earthquake-hub website here"
						type="text"
						placeholder="Username"
						value={inputUsername}
						onChange={(e) => setInputUsername(e.target.value)}
						required={true}
						autoFocus />
				</FloatingLabel>

				<Tooltip target=".passwordInput"></Tooltip>
				<FloatingLabel controlId="floatingPassword" label="Password">
					<Form.Control 
						className="passwordInput"
						data-pr-tooltip="Input your password here"
						type="password"
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
