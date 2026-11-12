import { createStore } from 'vuex';
import createPersistedState from "vuex-persistedstate";
import api from '@/api'

export default createStore({
  state: {
    token: null,
    id: null,
    username: null,
    avatar: null,
    // ids de las publicaciones que me gustaron y totales actualizados
    likes: [],
    likeCounts: {}
  },
  mutations: {
    setToken(state, t) {
      state.token = t
    },
    setId(state, id){
      state.id = id
    },
    setUsername(state, username){
      state.username = username
    },
    setAvatar(state, avatar){
      state.avatar = avatar
    },
    setLikes(state, ids){
      state.likes = ids
    },
    setLiked(state, { id, liked, likes }){
      const has = state.likes.includes(id)
      if (liked && !has) state.likes.push(id)
      if (!liked && has) state.likes = state.likes.filter(x => x !== id)
      state.likeCounts = { ...state.likeCounts, [id]: likes }
    },
    logout(state){
      state.token = null
      state.id = null
      state.username = null
      state.avatar = null
      state.likes = []
      state.likeCounts = {}
    }
  },
  getters:{
    token: state =>{
      return state.token
    },
    loggedId: state => {
      return state.id
    },
    username: state => {
      return state.username
    },
    avatar: state => {
      return state.avatar
    },
    isLiked: state => id => state.likes.includes(id),
    likesOf: state => post => state.likeCounts[post.post_id] !== undefined ? state.likeCounts[post.post_id] : post.likes
  },
  actions: {
    // guarda la sesion que devuelve el servidor (login o registro)
    login({ commit, dispatch }, data) {
      commit('setToken', data.token)
      commit('setId', data.id)
      commit('setUsername', data.username)
      commit('setAvatar', data.avatar || null)
      return dispatch('loadLikes')
    },
    loadLikes({ commit, state }) {
      if (!state.token) return Promise.resolve()
      return api.get('/posts/likes').then(r => commit('setLikes', r.data)).catch(() => {})
    },
    // da o saca el me gusta (un segundo toque lo saca)
    toggleLike({ commit }, postId) {
      return api.post(`/posts/like/${postId}`).then(r => {
        if (r.data.ok) commit('setLiked', { id: postId, liked: r.data.liked, likes: r.data.likes })
        return r.data
      })
    }
  },
  modules: {
  },
  plugins: [createPersistedState({ paths: ['token', 'id', 'username', 'avatar'] })],
})
