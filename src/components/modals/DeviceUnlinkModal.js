import React, { useRef } from "react";
import { Button, Dialog, Toast } from 'primereact';

function DeviceUnlinkModal(props) {
	const toast = useRef(null); //TOAST

	//HANDLE LINK FORM SUBMIT
	const handleDeviceUnlink = (event) => {
		event.preventDefault();
		// TODO: unlink device codeflow

		// toast.current.show({ severity: 'success', summary: 'Unlinking Success', detail: 'Device-Account Unlinked', life: 3000 });
	}

	const footerContent = (
		<div>
			<Button 
				label="Cancel"
				icon="pi pi-times"
				onClick={props.close}
				text 
				style={{
					backgroundColor: '#d1d1d1',
					color: '#333',
					border: 'none',
					borderRadius: '4px'
				}}
			/>
			<Button 
				label="Unlink"
				severity="danger"
				icon="pi pi-check"
				onClick={handleDeviceUnlink} 
				autoFocus 
				style={{
					backgroundColor: '#3a6a50',
					color: '#fff',
					border: 'none',
					borderRadius: '4px'
				}}
			/>
		</div>
	);

	return (
		<>
			<Toast ref={toast} onHide={() => window.location.reload()}></Toast>
			<Dialog header="Device-Account Unlink" visible={props.show} onHide={props.close} draggable={false} resizable={false} footer={footerContent}>
				<p className="m-2">
					Are you sure to unlink this device to account?
				</p>
			</Dialog>
		</>
	)
}

export default DeviceUnlinkModal;
