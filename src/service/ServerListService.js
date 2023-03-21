import axios from 'axios';

export const ServerListService = {
	getServersData() {
		return axios.get('/servers')
			.then(res => res.data)
	},

	getServers() {
		return Promise.resolve(this.getServersData());
	}

};