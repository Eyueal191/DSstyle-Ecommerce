import Axios from "../axios/axios.config.js";
import { setUserBag } from "../redux/bagSlice.js";
import toast from "react-hot-toast";

// Fetch user shopping bag
export const getUserBag = async (userId, dispatch) => {
  try {
    const response = await Axios.get(`/api/bag/${userId}`);
    const data = response.data;

    if (data.success) {
      const bag = data.userBag || { user: userId, items: [] };
      if (dispatch) dispatch(setUserBag(bag));
      return bag;
    }
    return { user: userId, items: [] };
  } catch (error) {
    console.warn("Failed to fetch shopping bag:", error.message);
    throw error;
  }
};

// Clear user shopping bag
export const clearUserBag = async (userId, dispatch) => {
  try {
    const response = await Axios.delete(`/api/bag/${userId}/clear`);
    const data = response.data;

    if (data.success) {
      toast.success(data.message || "Shopping bag cleared");
      if (dispatch) await getUserBag(userId, dispatch);
    }
    return data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to clear shopping bag");
    throw error;
  }
};

