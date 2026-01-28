import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthInfoService } from '../services/api';

export const fetchHealthInfo = createAsyncThunk('healthInfo/fetch', async () => {
  const res = await healthInfoService.getAll();
  return Array.isArray(res.data) ? res.data : res.data.results;
});
export const addHealthInfo = createAsyncThunk('healthInfo/add', async (data) => {
  const res = await healthInfoService.create(data);
  return res.data;
});
export const updateHealthInfo = createAsyncThunk('healthInfo/update', async ({ id, data }) => {
  const res = await healthInfoService.update(id, data);
  return res.data;
});
export const deleteHealthInfo = createAsyncThunk('healthInfo/delete', async (id) => {
  await healthInfoService.delete(id);
  return id;
});

const healthInfoSlice = createSlice({
  name: 'healthInfo',
  initialState: { list: [], loading: false, error: null, editing: null },
  reducers: {
    setEditing: (state, action) => { state.editing = action.payload; },
    clearEditing: (state) => { state.editing = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthInfo.pending, (state) => { state.loading = true; })
      .addCase(fetchHealthInfo.fulfilled, (state, action) => {
        state.loading = false; state.list = action.payload;
      })
      .addCase(fetchHealthInfo.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message;
      })
      .addCase(addHealthInfo.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateHealthInfo.fulfilled, (state, action) => {
        const idx = state.list.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteHealthInfo.fulfilled, (state, action) => {
        state.list = state.list.filter(i => i.id !== action.payload);
      });
  }
});
export const { setEditing, clearEditing } = healthInfoSlice.actions;
export default healthInfoSlice.reducer; 