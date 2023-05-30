import { configureStore } from '@reduxjs/toolkit'
import deviceInfoReducer from "./deviceInfo"
import serversInfoReducer from "./serversInfo"

export default configureStore({
  reducer: {
    deviceInfo: deviceInfoReducer,
    serversInfo: serversInfoReducer
  }
})