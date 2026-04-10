 
# Week 5 - Day 5: Pinia in Practice

## **Duration**: 1.5 hours (40 min theory + 50 min practice)

## Watch recorded lesson video here: [https://drive.google.com/file/d/1aeAn-oI_m5BoI3EkKd_WLiJnKxIWDn5a/view?usp=sharing](https://drive.google.com/file/d/1aeAn-oI_m5BoI3EkKd_WLiJnKxIWDn5a/view?usp=sharing)

---

## 🎯 Learning Objectives

By the end of this lesson, you will be able to:

1. **Understand** how to compose multiple stores together
2. **Implement** store-to-store communication patterns
3. **Create** reusable Pinia plugins for cross-cutting concerns
4. **Integrate** localStorage persistence automatically
5. **Combine** Pinia with Vue Router for authentication flows
6. **Apply** advanced patterns for scalable applications
7. **Build** production-ready Vue applications with best practices

---

## 📚 Theory Session (40 minutes)

### 1. Multiple Stores Working Together

**Why Multiple Stores?**

Instead of one giant store, split by domain/feature:

```
stores/
├── auth.js        # Authentication & user data
├── cart.js        # Shopping cart
├── products.js    # Product catalog
├── orders.js      # Order history
└── ui.js          # UI state (modals, loading, etc.)
```

**Benefits:**

| Benefit | Description |
|---------|-------------|
| **Separation of Concerns** | Each store handles one domain |
| **Maintainability** | Easier to find and update code |
| **Reusability** | Stores can be used independently |
| **Team Collaboration** | Different developers work on different stores |
| **Performance** | Only affected stores trigger updates |

---

### 2. Store Composition - Accessing Other Stores

**Pattern: One Store Using Another**

```javascript
// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.user?.name || 'Guest'
  },
  
  actions: {
    login(credentials) {
      // Login logic
      this.user = { name: credentials.email.split('@')[0] }
      this.token = 'fake-token-' + Date.now()
    },
    
    logout() {
      this.user = null
      this.token = null
    }
  }
})
```

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  
  getters: {
    itemCount: (state) => state.items.length
  },
  
  actions: {
    async addItem(product) {
      // Access auth store
      const authStore = useAuthStore()
      
      if (!authStore.isLoggedIn) {
        throw new Error('Please login to add items to cart')
      }
      
      this.items.push(product)
      
      // Save to server with auth token
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      })
    },
    
    clearCart() {
      this.items = []
    }
  }
})
```

**Key Points:**

1. Import store function: `import { useAuthStore } from './auth'`
2. Call it inside action: `const authStore = useAuthStore()`
3. Access its state/getters: `authStore.isLoggedIn`, `authStore.token`
4. Don't call stores in `state` or `getters`, only in `actions`

---

### 3. Coordinated State Changes

**Pattern: Multiple Stores Updating Together**

```javascript
// stores/auth.js
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { useWishlistStore } from './wishlist'
import { useOrdersStore } from './orders'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  
  actions: {
    async login(credentials) {
      // Authenticate
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      this.user = data.user
      this.token = data.token
      
      // Load user's data into other stores
      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      const ordersStore = useOrdersStore()
      
      await Promise.all([
        cartStore.fetchCart(),
        wishlistStore.fetchWishlist(),
        ordersStore.fetchOrders()
      ])
    },
    
    logout() {
      // Clear auth
      this.user = null
      this.token = null
      
      // Clear other stores
      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      const ordersStore = useOrdersStore()
      
      cartStore.clearCart()
      wishlistStore.clearWishlist()
      ordersStore.clearOrders()
    }
  }
})
```

**When to Use:**
- Login/Logout (coordinate all stores)
- Checkout (update cart + orders + inventory)
- Delete account (clear all user data)

---

### 4. Pinia Plugins

**What are Plugins?**

Plugins add functionality to all stores:
- Logging state changes
- LocalStorage persistence
- Error tracking
- Performance monitoring

**Creating a Simple Plugin:**

```javascript
// plugins/loggerPlugin.js
export function loggerPlugin({ store }) {
  // Called whenever any store is created
  
  store.$subscribe((mutation, state) => {
    // Called on every state change
    console.log(`[${store.$id}] ${mutation.type}`, mutation.payload)
    console.log('New state:', state)
  })
  
  store.$onAction(({ name, args, after, onError }) => {
    // Called before every action
    console.log(`[${store.$id}] Action "${name}" called with:`, args)
    
    after((result) => {
      console.log(`[${store.$id}] Action "${name}" finished with:`, result)
    })
    
    onError((error) => {
      console.error(`[${store.$id}] Action "${name}" failed:`, error)
    })
  })
}
```

**Using Plugin:**

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { loggerPlugin } from './plugins/loggerPlugin'
import App from './App.vue'

const pinia = createPinia()
pinia.use(loggerPlugin)

const app = createApp(App)
app.use(pinia)
app.mount('#app')
```

---

### 5. LocalStorage Persistence Plugin

**Auto-save to LocalStorage:**

```javascript
// plugins/persistPlugin.js
export function persistPlugin({ store, options }) {
  // Load saved state on store creation
  const savedState = localStorage.getItem(`pinia-${store.$id}`)
  if (savedState) {
    store.$patch(JSON.parse(savedState))
  }
  
  // Save on every state change
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
  })
}
```

**Using Plugin:**

```javascript
// main.js
import { createPinia } from 'pinia'
import { persistPlugin } from './plugins/persistPlugin'

const pinia = createPinia()
pinia.use(persistPlugin)
```

**Now ALL stores auto-persist!**

---

### 6. Selective Persistence Plugin

**Only persist specific stores:**

```javascript
// plugins/persistPlugin.js
export function persistPlugin({ store, options }) {
  // Check if store should be persisted
  if (!options.persist) return
  
  const storageKey = `pinia-${store.$id}`
  
  // Load from localStorage
  const savedState = localStorage.getItem(storageKey)
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      
      // Only restore specified paths
      if (options.persist.paths) {
        const stateToPatch = {}
        options.persist.paths.forEach(path => {
          if (parsed[path] !== undefined) {
            stateToPatch[path] = parsed[path]
          }
        })
        store.$patch(stateToPatch)
      } else {
        // Restore entire state
        store.$patch(parsed)
      }
    } catch (error) {
      console.error(`Failed to restore ${store.$id}:`, error)
    }
  }
  
  // Save on state change
  store.$subscribe((mutation, state) => {
    try {
      let dataToSave = state
      
      // Only save specified paths
      if (options.persist.paths) {
        dataToSave = {}
        options.persist.paths.forEach(path => {
          if (state[path] !== undefined) {
            dataToSave[path] = state[path]
          }
        })
      }
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error(`Failed to persist ${store.$id}:`, error)
    }
  })
}
```

**Using in Stores:**

```javascript
// stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    lastUpdated: null
  }),
  
  actions: {
    addItem(product) {
      this.items.push(product)
      this.lastUpdated = new Date()
    }
  }
}, {
  // Plugin options
  persist: {
    paths: ['items'] // Only persist items, not lastUpdated
  }
})
```

```javascript
// stores/ui.js
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isMenuOpen: false,
    theme: 'light'
  })
}, {
  persist: true // Persist entire state
})
```

---

### 7. Pinia + Vue Router Integration

**Authentication Flow:**

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect to login
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.meta.requiresGuest && authStore.isLoggedIn) {
    // Already logged in, go to dashboard
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

**Post-Login Redirect:**

```vue
<!-- LoginView.vue -->
<script>
import { mapActions, mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export default {
  data() {
    return {
      credentials: {
        email: '',
        password: ''
      }
    }
  },
  computed: {
    ...mapState(useAuthStore, ['isLoggedIn'])
  },
  methods: {
    ...mapActions(useAuthStore, ['login']),
    
    async handleLogin() {
      await this.login(this.credentials)
      
      // Redirect to intended page or dashboard
      const redirect = this.$route.query.redirect || '/dashboard'
      this.$router.push(redirect)
    }
  }
}
</script>
```

---

### 8. Loading States Across App

**Global Loading Store:**

```javascript
// stores/loading.js
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    tasks: new Set() // Track multiple loading tasks
  }),
  
  getters: {
    isLoading: (state) => state.tasks.size > 0
  },
  
  actions: {
    startLoading(taskId) {
      this.tasks.add(taskId)
    },
    
    stopLoading(taskId) {
      this.tasks.delete(taskId)
    }
  }
})
```

**Using in Other Stores:**

```javascript
// stores/products.js
import { defineStore } from 'pinia'
import { useLoadingStore } from './loading'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: []
  }),
  
  actions: {
    async fetchProducts() {
      const loadingStore = useLoadingStore()
      const taskId = 'fetch-products'
      
      try {
        loadingStore.startLoading(taskId)
        
        const response = await fetch('/api/products')
        this.products = await response.json()
      } finally {
        loadingStore.stopLoading(taskId)
      }
    }
  }
})
```

**Global Loading Indicator:**

```vue
<!-- App.vue -->
<template>
  <div class="min-h-screen">
    <!-- Global Loading Bar -->
    <div v-if="isLoading" class="fixed top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse z-50"></div>
    
    <!-- Rest of app -->
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useLoadingStore } from '@/stores/loading'

export default {
  computed: {
    ...mapState(useLoadingStore, ['isLoading'])
  }
}
</script>
```

---

### 9. Error Handling Store

**Centralized Error Management:**

```javascript
// stores/errors.js
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('errors', {
  state: () => ({
    errors: []
  }),
  
  actions: {
    addError(error) {
      const errorObj = {
        id: Date.now(),
        message: error.message || 'An error occurred',
        type: error.type || 'error',
        timestamp: new Date()
      }
      
      this.errors.push(errorObj)
      
      // Auto-remove after 5 seconds
      setTimeout(() => this.removeError(errorObj.id), 5000)
    },
    
    removeError(id) {
      this.errors = this.errors.filter(e => e.id !== id)
    },
    
    clearAll() {
      this.errors = []
    }
  }
})
```

**Using in Actions:**

```javascript
// stores/products.js
import { defineStore } from 'pinia'
import { useErrorStore } from './errors'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: []
  }),
  
  actions: {
    async fetchProducts() {
      const errorStore = useErrorStore()
      
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error('Failed to fetch products')
        this.products = await response.json()
      } catch (error) {
        errorStore.addError({
          message: error.message,
          type: 'error'
        })
      }
    }
  }
})
```

**Error Display Component:**

```vue
<!-- components/ErrorDisplay.vue -->
<template>
  <div class="fixed top-4 right-4 space-y-2 z-50">
    <div 
      v-for="error in errors" 
      :key="error.id"
      class="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 animate-slide-in">
      <span class="text-2xl">⚠️</span>
      <div class="flex-1">
        <p class="font-semibold">{{ error.message }}</p>
      </div>
      <button 
        @click="removeError(error.id)"
        class="text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useErrorStore } from '@/stores/errors'

export default {
  computed: {
    ...mapState(useErrorStore, ['errors'])
  },
  methods: {
    ...mapActions(useErrorStore, ['removeError'])
  }
}
</script>

<style>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
```

---

### 10. Best Practices Summary

**Do's:**

✅ **Split by Domain** - One store per feature/domain  
✅ **Use Store Composition** - Let stores access each other in actions  
✅ **Handle Errors Centrally** - Use error store for consistent UX  
✅ **Persist Important Data** - Cart, preferences, auth tokens  
✅ **Use Plugins** - For cross-cutting concerns  
✅ **Type Your State** - Use TypeScript for safety  
✅ **Keep Actions Simple** - One action = one responsibility  

**Don'ts:**

❌ **Don't Create Giant Stores** - Split when > 200 lines  
❌ **Don't Call Stores in Getters** - Only in actions  
❌ **Don't Mutate State Directly** - Always use actions  
❌ **Don't Store Computed Values** - Use getters instead  
❌ **Don't Persist Everything** - Be selective  
❌ **Don't Forget Error Handling** - Always catch async errors  

---

## 💻 Hands-On Practice (50 minutes)

### Exercise 1: Multi-Store Blog Application (50 minutes)

**Objective**: Build a complete blog with authentication, posts, comments, and UI state.

**Step 1: Create Auth Store**

Create `src/stores/auth.js`:

```javascript
import { defineStore } from 'pinia'
import { usePostsStore } from './posts'
import { useUIStore } from './ui'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.user?.name || 'Guest',
    userRole: (state) => state.user?.role || 'guest'
  },
  
  actions: {
    login(email, password) {
      // Mock authentication
      this.user = {
        id: Date.now(),
        name: email.split('@')[0],
        email: email,
        role: email.includes('admin') ? 'admin' : 'user',
        avatar: email.charAt(0).toUpperCase()
      }
      this.token = 'token-' + Date.now()
      
      // Load user's posts
      const postsStore = usePostsStore()
      postsStore.fetchPosts()
      
      // Show success message
      const uiStore = useUIStore()
      uiStore.showNotification('Welcome back!', 'success')
    },
    
    logout() {
      this.user = null
      this.token = null
      
      // Clear posts
      const postsStore = usePostsStore()
      postsStore.clearPosts()
      
      // Show message
      const uiStore = useUIStore()
      uiStore.showNotification('Logged out successfully', 'info')
    },
    
    updateProfile(updates) {
      if (this.user) {
        this.user = { ...this.user, ...updates }
      }
    }
  }
}, {
  persist: {
    paths: ['user', 'token'] // Persist auth data
  }
})
```

**Step 2: Create Posts Store**

Create `src/stores/posts.js`:

```javascript
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useUIStore } from './ui'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    currentPost: null,
    filter: 'all' // 'all', 'my-posts', 'drafts'
  }),
  
  getters: {
    filteredPosts() {
      const authStore = useAuthStore()
      
      if (this.filter === 'my-posts') {
        return this.posts.filter(p => p.authorId === authStore.user?.id)
      }
      if (this.filter === 'drafts') {
        return this.posts.filter(p => p.status === 'draft' && p.authorId === authStore.user?.id)
      }
      return this.posts.filter(p => p.status === 'published')
    },
    
    getPostById: (state) => {
      return (id) => state.posts.find(p => p.id === id)
    },
    
    myPostsCount() {
      const authStore = useAuthStore()
      return this.posts.filter(p => p.authorId === authStore.user?.id).length
    }
  },
  
  actions: {
    fetchPosts() {
      // Mock data
      this.posts = [
        {
          id: 1,
          title: 'Getting Started with Vue 3',
          content: 'Vue 3 brings many improvements...',
          authorId: 1,
          authorName: 'Admin',
          status: 'published',
          createdAt: new Date().toISOString(),
          likes: 42,
          comments: []
        },
        {
          id: 2,
          title: 'Understanding Pinia',
          content: 'Pinia is the official state management...',
          authorId: 1,
          authorName: 'Admin',
          status: 'published',
          createdAt: new Date().toISOString(),
          likes: 38,
          comments: []
        }
      ]
    },
    
    createPost(postData) {
      const authStore = useAuthStore()
      const uiStore = useUIStore()
      
      if (!authStore.isLoggedIn) {
        uiStore.showNotification('Please login to create posts', 'error')
        return
      }
      
      const newPost = {
        id: Date.now(),
        title: postData.title,
        content: postData.content,
        authorId: authStore.user.id,
        authorName: authStore.userName,
        status: postData.isDraft ? 'draft' : 'published',
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      }
      
      this.posts.unshift(newPost)
      uiStore.showNotification('Post created successfully!', 'success')
      
      return newPost
    },
    
    updatePost(id, updates) {
      const post = this.posts.find(p => p.id === id)
      if (post) {
        Object.assign(post, updates)
        
        const uiStore = useUIStore()
        uiStore.showNotification('Post updated', 'success')
      }
    },
    
    deletePost(id) {
      this.posts = this.posts.filter(p => p.id !== id)
      
      const uiStore = useUIStore()
      uiStore.showNotification('Post deleted', 'info')
    },
    
    likePost(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isLoggedIn) {
        const uiStore = useUIStore()
        uiStore.showNotification('Please login to like posts', 'error')
        return
      }
      
      const post = this.posts.find(p => p.id === id)
      if (post) {
        post.likes++
      }
    },
    
    addComment(postId, commentText) {
      const authStore = useAuthStore()
      
      if (!authStore.isLoggedIn) {
        const uiStore = useUIStore()
        uiStore.showNotification('Please login to comment', 'error')
        return
      }
      
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        post.comments.push({
          id: Date.now(),
          authorName: authStore.userName,
          text: commentText,
          createdAt: new Date().toISOString()
        })
      }
    },
    
    setFilter(filter) {
      this.filter = filter
    },
    
    clearPosts() {
      this.posts = []
      this.currentPost = null
    }
  }
}, {
  persist: {
    paths: ['posts'] // Persist posts
  }
})
```

**Step 3: Create UI Store**

Create `src/stores/ui.js`:

```javascript
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    notifications: [],
    isCreateModalOpen: false,
    isSidebarOpen: false,
    theme: 'light'
  }),
  
  actions: {
    showNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type // 'success', 'error', 'info', 'warning'
      }
      
      this.notifications.push(notification)
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        this.removeNotification(notification.id)
      }, 3000)
    },
    
    removeNotification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },
    
    openCreateModal() {
      this.isCreateModalOpen = true
    },
    
    closeCreateModal() {
      this.isCreateModalOpen = false
    },
    
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    }
  }
}, {
  persist: {
    paths: ['theme'] // Only persist theme
  }
})
```

**Step 4: Create Persistence Plugin**

Create `src/plugins/persistPlugin.js`:

```javascript
export function persistPlugin({ store, options }) {
  if (!options.persist) return
  
  const storageKey = `blog-${store.$id}`
  
  // Load from localStorage
  const savedState = localStorage.getItem(storageKey)
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      
      if (options.persist.paths) {
        const stateToPatch = {}
        options.persist.paths.forEach(path => {
          if (parsed[path] !== undefined) {
            stateToPatch[path] = parsed[path]
          }
        })
        store.$patch(stateToPatch)
      } else {
        store.$patch(parsed)
      }
    } catch (error) {
      console.error(`Failed to restore ${store.$id}:`, error)
    }
  }
  
  // Save on state change
  store.$subscribe((mutation, state) => {
    try {
      let dataToSave = state
      
      if (options.persist.paths) {
        dataToSave = {}
        options.persist.paths.forEach(path => {
          if (state[path] !== undefined) {
            dataToSave[path] = state[path]
          }
        })
      }
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error(`Failed to persist ${store.$id}:`, error)
    }
  })
}
```

**Step 5: Update main.js**

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { persistPlugin } from './plugins/persistPlugin'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
pinia.use(persistPlugin)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
```

**Step 6: Create Blog View**

Create `src/views/BlogView.vue`:

```vue
<template>
  <div class="max-w-4xl mx-auto p-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-gray-800">Blog Posts</h1>
      
      <button 
        v-if="auth.isLoggedIn"
        @click="ui.openCreateModal()"
        class="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition">
        + New Post
      </button>
    </div>
    
    <!-- Filters -->
    <div v-if="auth.isLoggedIn" class="flex gap-3 mb-8">
      <button 
        @click="posts.setFilter('all')"
        :class="filterButtonClass('all')">
        All Posts
      </button>
      <button 
        @click="posts.setFilter('my-posts')"
        :class="filterButtonClass('my-posts')">
        My Posts ({{ posts.myPostsCount }})
      </button>
      <button 
        @click="posts.setFilter('drafts')"
        :class="filterButtonClass('drafts')">
        Drafts
      </button>
    </div>
    
    <!-- Posts List -->
    <div class="space-y-6">
      <div 
        v-for="post in posts.filteredPosts" 
        :key="post.id"
        class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
        
        <!-- Post Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">{{ post.title }}</h2>
            <div class="flex items-center gap-4 text-gray-600">
              <span>By {{ post.authorName }}</span>
              <span>•</span>
              <span>{{ formatDate(post.createdAt) }}</span>
              <span v-if="post.status === 'draft'" class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                Draft
              </span>
            </div>
          </div>
          
          <!-- Actions (if author) -->
          <div v-if="post.authorId === auth.user?.id" class="flex gap-2">
            <button 
              @click="editPost(post)"
              class="text-blue-600 hover:text-blue-700">
              Edit
            </button>
            <button 
              @click="posts.deletePost(post.id)"
              class="text-red-600 hover:text-red-700">
              Delete
            </button>
          </div>
        </div>
        
        <!-- Post Content -->
        <p class="text-gray-700 mb-6">{{ post.content }}</p>
        
        <!-- Post Footer -->
        <div class="flex items-center gap-6 pt-4 border-t">
          <button 
            @click="posts.likePost(post.id)"
            class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition">
            <span class="text-xl">👍</span>
            <span>{{ post.likes }}</span>
          </button>
          
          <button 
            @click="showComments(post)"
            class="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
            <span class="text-xl">💬</span>
            <span>{{ post.comments.length }}</span>
          </button>
        </div>
        
        <!-- Comments Section (if open) -->
        <div v-if="openComments === post.id" class="mt-6 pt-6 border-t">
          <h3 class="font-bold text-gray-800 mb-4">Comments</h3>
          
          <!-- Comment Form -->
          <div v-if="auth.isLoggedIn" class="mb-6">
            <div class="flex gap-3">
              <input 
                v-model="commentText"
                type="text"
                placeholder="Add a comment..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <button 
                @click="addComment(post.id)"
                class="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                Post
              </button>
            </div>
          </div>
          
          <!-- Comments List -->
          <div class="space-y-3">
            <div 
              v-for="comment in post.comments" 
              :key="comment.id"
              class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-start mb-2">
                <span class="font-semibold text-gray-800">{{ comment.authorName }}</span>
                <span class="text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="text-gray-700">{{ comment.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="posts.filteredPosts.length === 0" class="text-center py-16">
      <p class="text-6xl mb-4">📝</p>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">No posts yet</h2>
      <p class="text-gray-600">Be the first to create a post!</p>
    </div>
    
    <!-- Create Post Modal -->
    <div 
      v-if="ui.isCreateModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="ui.closeCreateModal()">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Create New Post</h2>
        
        <form @submit.prevent="createPost" class="space-y-4">
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Title</label>
            <input 
              v-model="newPost.title"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
          
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Content</label>
            <textarea 
              v-model="newPost.content"
              rows="6"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>
          
          <div class="flex items-center gap-3">
            <input 
              v-model="newPost.isDraft"
              type="checkbox"
              id="draft"
              class="w-4 h-4">
            <label for="draft" class="text-gray-700">Save as draft</label>
          </div>
          
          <div class="flex gap-4">
            <button 
              type="submit"
              class="flex-1 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition">
              Create Post
            </button>
            <button 
              type="button"
              @click="ui.closeCreateModal()"
              class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Notifications -->
    <div class="fixed top-4 right-4 space-y-2 z-50">
      <div 
        v-for="notif in ui.notifications" 
        :key="notif.id"
        :class="notificationClass(notif.type)"
        class="px-6 py-4 rounded-lg shadow-lg animate-slide-in">
        {{ notif.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'BlogView',
  data() {
    return {
      newPost: {
        title: '',
        content: '',
        isDraft: false
      },
      commentText: '',
      openComments: null
    }
  },
  computed: {
    // Map entire stores to component
    ...mapStores(useAuthStore, usePostsStore, useUIStore),
    
    // Create short aliases for easier template access
    auth() {
      return this.authStore
    },
    posts() {
      return this.postsStore
    },
    ui() {
      return this.uiStore
    }
  },
  mounted() {
    // Load posts on mount
    if (this.posts.posts.length === 0) {
      this.posts.fetchPosts()
    }
  },
  methods: {
    createPost() {
      this.posts.createPost(this.newPost)
      this.newPost = { title: '', content: '', isDraft: false }
      this.ui.closeCreateModal()
    },
    
    addComment(postId) {
      if (this.commentText.trim()) {
        this.posts.addComment(postId, this.commentText)
        this.commentText = ''
      }
    },
    
    showComments(post) {
      this.openComments = this.openComments === post.id ? null : post.id
    },
    
    editPost(post) {
      this.newPost = {
        title: post.title,
        content: post.content,
        isDraft: post.status === 'draft'
      }
      this.ui.openCreateModal()
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    },
    
    filterButtonClass(filter) {
      const baseClass = 'px-6 py-2 rounded-lg font-semibold transition'
      return this.posts.filter === filter
        ? baseClass + ' bg-emerald-500 text-white'
        : baseClass + ' bg-gray-200 text-gray-700 hover:bg-gray-300'
    },
    
    notificationClass(type) {
      const classes = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-white'
      }
      return classes[type] || classes.info
    }
  }
}
</script>

<style>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
```

**Expected Output:**

✅ Login/logout with coordinated state updates  
✅ Create/edit/delete posts (with permissions)  
✅ Like posts and add comments  
✅ Filter by all/my posts/drafts  
✅ Toast notifications for all actions  
✅ LocalStorage persistence  
✅ Modal for post creation  

---
📝 **[Homework Assignment](../homeworks/w5d5-homework.md)**
---
## 📝 Summary

Today we mastered advanced Pinia patterns:

✅ **Multiple Stores**:
- Split state by domain/feature
- Organized, maintainable structure
- Independent or coordinated updates

✅ **Store Composition**:
- Stores accessing other stores
- Coordinated state changes
- Shared authentication logic

✅ **Pinia Plugins**:
- Logger plugin for debugging
- Persistence plugin for localStorage
- Selective persistence with paths

✅ **Router Integration**:
- Authentication guards with Pinia
- Post-login redirects
- Protected routes

✅ **Advanced Patterns**:
- Global loading states
- Centralized error handling
- UI state management
- Notification system

**Key Takeaways:**
- Multiple stores scale better than one giant store
- Stores can communicate through composition
- Plugins add functionality to all stores
- Always handle errors gracefully
- Persist only necessary data
- Coordinate state updates for complex operations

---

## 📚 Additional Resources

- [Pinia Core Concepts](https://pinia.vuejs.org/core-concepts/)
- [Pinia Plugins](https://pinia.vuejs.org/core-concepts/plugins.html)
- [Using Multiple Stores](https://pinia.vuejs.org/cookbook/composing-stores.html)
- [State Persistence Best Practices](https://pinia.vuejs.org/cookbook/options-api.html)
- [Pinia + Vue Router](https://pinia.vuejs.org/cookbook/migration-vuex.html)
