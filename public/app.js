// Global variables
let currentUser = null;
let currentPostId = null;

// API Base URL
const API_BASE_URL = '/api';

// DOM Elements
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const postsContainer = document.getElementById('posts-container');
const postsLoading = document.getElementById('posts-loading');
const noPosts = document.getElementById('no-posts');
const postModal = document.getElementById('post-modal');
const closeModal = document.getElementById('close-modal');

// Navigation elements
const loginLink = document.getElementById('login-link');
const registerLink = document.getElementById('register-link');
const profileLink = document.getElementById('profile-link');
const createPostLink = document.getElementById('create-post-link');
const logoutBtn = document.getElementById('logout-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadPosts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Modal close
    if (closeModal) {
        closeModal.addEventListener('click', closePostModal);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Close modal when clicking outside
    if (postModal) {
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal) {
                closePostModal();
            }
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
}

// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('blogToken');
    const userData = localStorage.getItem('blogUser');
    
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateNavigation(true);
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else {
        updateNavigation(false);
    }
}

function updateNavigation(isLoggedIn) {
    if (isLoggedIn) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'block';
        if (createPostLink) createPostLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (profileLink) profileLink.style.display = 'none';
        if (createPostLink) createPostLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('blogToken');
    localStorage.removeItem('blogUser');
    currentUser = null;
    updateNavigation(false);
    showAlert('Logged out successfully', 'success');
    
    // Redirect to home if on protected pages
    const protectedPages = ['create-post.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
    }
    
    // Reload posts to update like buttons
    if (postsContainer) {
        loadPosts();
    }
}

// API functions
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('blogToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Posts functions
async function loadPosts() {
    if (!postsContainer) return;
    
    try {
        if (postsLoading) postsLoading.style.display = 'block';
        if (noPosts) noPosts.style.display = 'none';
        postsContainer.innerHTML = '';
        
        const posts = await apiRequest('/posts');
        
        if (postsLoading) postsLoading.style.display = 'none';
        
        if (posts.length === 0) {
            if (noPosts) noPosts.style.display = 'block';
            return;
        }
        
        posts.forEach(post => {
            const postCard = createPostCard(post);
            postsContainer.appendChild(postCard);
        });
        
    } catch (error) {
        if (postsLoading) postsLoading.style.display = 'none';
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
    }
}

function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.onclick = () => openPostModal(post);
    
    const isLiked = currentUser && post.likes.includes(currentUser._id);
    const likeIcon = isLiked ? 'fas' : 'far';
    
    postCard.innerHTML = `
        <div class="post-header">
            <div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <div class="post-meta">
                    <span class="author">${escapeHtml(post.author.name)}</span>
                    <span class="date">${formatDate(post.createdAt)}</span>
                </div>
            </div>
        </div>
        <p class="post-preview">${escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}</p>
        <div class="post-actions">
            <button class="btn-like ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike('${post._id}')" ${!currentUser ? 'disabled title="Login to like posts"' : ''}>
                <i class="${likeIcon} fa-heart"></i> ${post.likes.length}
            </button>
        </div>
    `;
    
    return postCard;
}

async function toggleLike(postId) {
    if (!currentUser) {
        showAlert('Please login to like posts', 'error');
        return;
    }
    
    try {
        const result = await apiRequest(`/posts/${postId}/like`, {
            method: 'PATCH'
        });
        
        // Reload posts to update like counts
        loadPosts();
        
        // Update modal if it's open for this post
        if (currentPostId === postId) {
            updateModalLikeButton(result.likesCount, result.likesBy);
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showAlert(error.message, 'error');
    }
}

// Modal functions
function openPostModal(post) {
    currentPostId = post._id;
    
    // Update modal content
    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-author').textContent = post.author.name;
    document.getElementById('modal-date').textContent = formatDate(post.createdAt);
    document.getElementById('modal-content').textContent = post.content;
    
    // Update like button
    updateModalLikeButton(post.likes.length, post.likes);
    
    // Show/hide edit and delete buttons
    const editBtn = document.getElementById('modal-edit-btn');
    const deleteBtn = document.getElementById('modal-delete-btn');
    
    if (currentUser && post.author._id === currentUser._id) {
        editBtn.style.display = 'inline-flex';
        deleteBtn.style.display = 'inline-flex';
        editBtn.onclick = () => editPost(post._id);
        deleteBtn.onclick = () => deletePost(post._id);
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
    
    // Setup like button
    const likeBtn = document.getElementById('modal-like-btn');
    if (currentUser) {
        likeBtn.onclick = () => toggleLike(post._id);
        likeBtn.disabled = false;
        likeBtn.title = '';
    } else {
        likeBtn.onclick = null;
        likeBtn.disabled = true;
        likeBtn.title = 'Login to like posts';
    }
    
    // Show/hide comment form
    const commentForm = document.getElementById('comment-form');
    if (currentUser) {
        commentForm.style.display = 'block';
        setupCommentForm(post._id);
    } else {
        commentForm.style.display = 'none';
    }
    
    // Load comments
    loadComments(post._id);
    
    // Show modal
    postModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePostModal() {
    postModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentPostId = null;
}

function updateModalLikeButton(likesCount, likesArray) {
    const likeBtn = document.getElementById('modal-like-btn');
    const likesCountSpan = document.getElementById('modal-likes-count');
    
    likesCountSpan.textContent = likesCount;
    
    if (currentUser && likesArray.includes(currentUser._id)) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').className = 'fas fa-heart';
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('i').className = 'far fa-heart';
    }
}

// Comments functions
async function loadComments(postId) {
    const commentsContainer = document.getElementById('comments-container');
    
    try {
        commentsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';
        
        const comments = await apiRequest(`/comments/${postId}`);
        
        commentsContainer.innerHTML = '';
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsContainer.innerHTML = '<p class="error">Error loading comments.</p>';
    }
}

function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    
    const canDelete = currentUser && (comment.author._id === currentUser._id);
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.author.name)}</span>
            <span class="comment-date">${formatDate(comment.createdAt)}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
        ${canDelete ? `<div class="comment-actions"><button class="btn-delete-comment" onclick="deleteComment('${comment._id}')"><i class="fas fa-trash"></i> Delete</button></div>` : ''}
    `;
    
    return commentDiv;
}

function setupCommentForm(postId) {
    const submitBtn = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-input');
    
    submitBtn.onclick = () => submitComment(postId);
    
    // Allow submit with Enter (but not Shift+Enter)
    commentInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitComment(postId);
        }
    };
}

async function submitComment(postId) {
    const commentInput = document.getElementById('comment-input');
    const content = commentInput.value.trim();
    
    if (!content) {
        showAlert('Please enter a comment', 'error');
        return;
    }
    
    try {
        await apiRequest(`/comments/${postId}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        commentInput.value = '';
        loadComments(postId);
        showAlert('Comment added successfully', 'success');
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showAlert(error.message, 'error');
    }
}

async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        await apiRequest(`/comments/${commentId}`, {
            method: 'DELETE'
        });
        
        loadComments(currentPostId);
        showAlert('Comment deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showAlert(error.message, 'error');
    }
}

// Post management functions
function editPost(postId) {
    window.location.href = `create-post.html?edit=${postId}`;
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        await apiRequest(`/posts/${postId}`, {
            method: 'DELETE'
        });
        
        closePostModal();
        loadPosts();
        showAlert('Post deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting post:', error);
        showAlert(error.message, 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of the page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Form validation
function validateForm(formData) {
    const errors = [];
    
    if (!formData.name && formData.name !== undefined) {
        errors.push('Name is required');
    }
    
    if (!formData.email) {
        errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.push('Email is invalid');
    }
    
    if (!formData.password) {
        errors.push('Password is required');
    } else if (formData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    if (formData.confirmPassword !== undefined && formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    return errors;
}

// Export for use in other files
window.blogApp = {
    apiRequest,
    checkAuthStatus,
    updateNavigation,
    logout,
    showAlert,
    validateForm,
    formatDate,
    escapeHtml,
    currentUser: () => currentUser
};