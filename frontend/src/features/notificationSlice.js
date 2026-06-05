import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../services/api';

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadNotifications({ exclude_type: 'DOWNLOAD' });
      return response.data?.length || 0;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    status: 'idle',
    error: null
  },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setUnreadCount, decrementUnreadCount, incrementUnreadCount } = notificationSlice.actions;

export const selectUnreadCount = (state) => state.notifications.unreadCount;

export default notificationSlice.reducer;
