import axios from 'axios';

export const ServerListService = {
	getServersData() {
		return axios.get('/servers')
			.then(res => res.data.servers)
	},

	getServers() {
		return Promise.resolve(this.getServersData());
	}

};