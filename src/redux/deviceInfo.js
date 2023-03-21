import { createSlice } from '@reduxjs/toolkit'

export const deviceInfoSlice = createSlice({
  name: 'deviceInfo',
  initialState: {
    network: "Not Set",
    station: "Not Set",
    location: "Not Set",
    status: "Not Set"
  },
  reducers: {
    setDeviceNetwork: (state, action) => {
      state.network = action.payload
    },
    setDeviceStation: (state, action) => {
      state.station = action.payload
    },
    setDeviceLocation: (state, action) => {
      state.location = action.payload
    },
    setDeviceStatus: (state, action) => {
      state.status = action.payload
    },
    unsetDeviceNetwork: state => {
      state.network = "Not Set"
    },
  }
})

// Action creators are generated for each case reducer function
export const { 
  setDeviceNetwork, 
  unsetDeviceNetwork, 
  setDeviceStation, 
  setDeviceLocation,
  setDeviceStatus } = deviceInfoSlice.actions

export default deviceInfoSlice.reducer