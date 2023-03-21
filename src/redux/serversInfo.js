import { createSlice } from '@reduxjs/toolkit'

export const serversInfoSlice = createSlice({
  name: 'deviceInfo',
  initialState: {
    isConnected: false,
  },
  reducers: {
    setConnection: (state, action) => {
      state.isConnected = action.payload
    },
    // unsetDeviceNetwork: state => {
    //   state.network = "Not Set"
    // },
  }
})

// Action creators are generated for each case reducer function
export const { setConnection } = serversInfoSlice.actions

export default serversInfoSlice.reducer