import React, { useState, useRef } from "react";
import { Button, Dialog, Toast, Tooltip, InputText, Password } from 'primereact';
import axios from "axios";
import './Modal.css'

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
			<Dialog header="Device-Account Link" visible={props.show} style={{ width: '25vw' }} onHide={hideModal} draggable={false} resizable={false} footer={footerContent}>
				<div className="p-dialog-center p-fluid">
					<form>
						<div className="p-field">
							<span className="p-float-label">
								<InputText
									id="usernameInput"
									data-pr-tooltip="Input your username here"
									value={inputUsername}
									onChange={(e) => setInputUsername(e.target.value)}
									autoFocus
								/>
								<label htmlFor="usernameInput">Username</label>
								<Tooltip target="#usernameInput"></Tooltip>
							</span>
						</div>

						<div className="p-field">
							<span className="p-float-label">
								<Password
									id="passwordInput"
									data-pr-tooltip="Input your password here"
									value={inputPassword}
									onChange={(e) => setInputPassword(e.target.value)}
									toggleMask
									feedback={false}
								/>
								<label htmlFor="passwordInput">Password</label>
								<Tooltip target="#passwordInput"></Tooltip>
							</span>
						</div>
					</form>
				</div>
			</Dialog>
		</>
	)
}

export default DeviceLinkModal;
