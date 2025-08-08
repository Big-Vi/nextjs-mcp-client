'use client';

import { useState } from 'react';
import { MCPServer } from '../hooks/useMCP';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (server: MCPServer) => void;
}

export default function AddServerModal({ isOpen, onClose, onAddServer }: AddServerModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    url: '',
    requiresAuth: false,
    authType: 'bearer' as 'bearer' | 'basic' | 'custom'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      url: '',
      requiresAuth: false,
      authType: 'bearer'
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Server ID is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'Server ID must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Server name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Server URL is required';
    } else if (!formData.url.startsWith('/api/') && !formData.url.startsWith('http')) {
      newErrors.url = 'URL must start with /api/ (for API routes) or http (for external servers)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newServer: MCPServer = {
      id: formData.id,
      name: formData.name,
      description: formData.description || `Custom MCP server: ${formData.name}`,
      url: formData.url,
      requiresAuth: formData.requiresAuth,
      authType: formData.requiresAuth ? formData.authType : undefined,
      isDefault: false
    };

    onAddServer(newServer);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Custom MCP Server
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Server ID *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., my-custom-mcp"
            />
            {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Server Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., My Custom MCP Server"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Brief description of the server"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Server URL *
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., /api/my-mcp or http://localhost:3333/mcp"
            />
            {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiresAuth"
              checked={formData.requiresAuth}
              onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="requiresAuth" className="text-sm text-gray-700 dark:text-gray-300">
              Requires Authentication
            </label>
          </div>

          {formData.requiresAuth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Authentication Type
              </label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as 'bearer' | 'basic' | 'custom' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Server
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
