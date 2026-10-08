import { useState } from "react"

export function FileTree({ path, onNavigate, onFileClick, onDelete }) {
  const [folders, setFolders] = useState({})

  const toggleFolder = (path) => {
    setFolders((prev) => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  // Mock file tree data - in production this would come from an API
const mockNodes = [
    { name: "src", path: "src", isDirectory: true },
    { name: "components", path: "src/components", isDirectory: true },
    { name: "FileTree.jsx", path: "src/components/FileTree.jsx", isDirectory: false },
    { name: "AurexManager.jsx", path: "src/components/admin/AurexManager.jsx", isDirectory: false },
    { name: "package.json", path: "package.json", isDirectory: false },
  ];

  const handleFileClick = (path) => {
    console.log("File clicked:", path)
  }

  const handleDelete = (path) => {
    if (window.confirm(`Delete ${path}?`)) {
      console.log("Delete:", path)
    }
  }

  return (
    <div className="space-y-1">
      {[
        { name: "src", path: "src", isDirectory: true },
        { name: "components", path: "src/components", isDirectory: true },
        { name: "FileTree.jsx", path: "src/components/FileTree.jsx", isDirectory: false },
        { name: "AurexManager.jsx", path: "src/components/admin/AurexManager.jsx", isDirectory: false },
        { name: "package.json", path: "package.json", isDirectory: false },
      ].map((node) => (
        <div key={node.path} className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
          {node.isDirectory ? (
            <span className="cursor-pointer select-none">📁</span>
          ) : (
            <span className="text-zinc-400">📄</span>
          )}
          <span
            className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
            onClick={() => console.log("File clicked:", node.path)}
          >
            {node.name}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); console.log("Delete:", node.path) }}
            className="text-zinc-400 hover:text-red-500 text-xs px-1"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  )
}

export default FileTree