import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./productSlice.js";
import bagReducer from "./bagSlice.js";

const store = configureStore({
  reducer: {
    product: productReducer,
    userBag: bagReducer,
    userCart: bagReducer, // alias for backward compatibility
  },
});

export default store;
