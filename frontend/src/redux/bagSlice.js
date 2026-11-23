import { createSlice } from "@reduxjs/toolkit";

const bagSlice = createSlice({
  name: "userBag",
  initialState: {
    userBag: {
      user: null,
      items: [],
    },
  },
  reducers: {
    setUserBag: (state, action) => {
      state.userBag = action.payload;
    },
  },
});

export const { setUserBag } = bagSlice.actions;

// Backward compatibility alias
export const setUserCart = setUserBag;

export default bagSlice.reducer;

