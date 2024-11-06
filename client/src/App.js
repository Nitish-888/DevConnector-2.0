import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Alert from './components/layout/Alert';
import Dashboard from './components/dashboard/Dashboard';
import ProfileForm from './components/profile-forms/ProfileForm';
import AddExperience from './components/profile-forms/AddExperience';
import AddEducation from './components/profile-forms/AddEducation';
import Profiles from './components/profiles/Profiles';
import Profile from './components/profile/Profile';
import Posts from './components/posts/Posts';
import Post from './components/post/Post';
import DevelopersList from './components/chat/DevelopersList';
import Chat from './components/chat/Chat';
import GroupChat from './components/chat/GroupChat';
import CreateGroup from './components/chat/CreateGroup';  // Import the CreateGroup component
import PublicChat from './components/chat/PublicChat';
import NotFound from './components/layout/NotFound';
import PrivateRoute from './components/routing/PrivateRoute';
import { LOGOUT } from './actions/types';

// Redux
import { Provider } from 'react-redux';
import store from './store';
import { loadUser } from './actions/auth';
import setAuthToken from './utils/setAuthToken';

import './App.css';

const App = () => {
  useEffect(() => {
    // check for token in LS when app first runs
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }
    store.dispatch(loadUser());
    window.addEventListener('storage', () => {
      if (!localStorage.token) store.dispatch({ type: LOGOUT });
    });
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <Alert />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route
            path="dashboard"
            element={<PrivateRoute>
              <Dashboard />
            </PrivateRoute>}
          />
          <Route
            path="create-profile"
            element={<PrivateRoute>
              <ProfileForm />
            </PrivateRoute>}
          />
          <Route
            path="edit-profile"
            element={<PrivateRoute>
              <ProfileForm />
            </PrivateRoute>}
          />
          <Route
            path="add-experience"
            element={<PrivateRoute>
              <AddExperience />
            </PrivateRoute>}
          />
          <Route
            path="add-education"
            element={<PrivateRoute>
              <AddEducation />
            </PrivateRoute>}
          />
          <Route path="posts" element={<PrivateRoute>
            <Posts />
          </PrivateRoute>} />
          <Route path="posts/:id" element={<PrivateRoute>
            <Post />
          </PrivateRoute>} />
          <Route 
            path="chat"
            element={<PrivateRoute>
              <DevelopersList />
            </PrivateRoute>}
          />
          <Route 
            path="chat/public"
            element={<PrivateRoute>
              <PublicChat />
            </PrivateRoute>}
          />
          <Route 
            path="chat/:roomId"
            element={<PrivateRoute>
              <Chat />
            </PrivateRoute>}
          />
          <Route 
            path="groupChat/:groupId"
            element={<PrivateRoute>
              <GroupChat />
            </PrivateRoute>}
          />
          <Route 
            path="create-group"
            element={<PrivateRoute>
              <CreateGroup />
            </PrivateRoute>}
          />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
