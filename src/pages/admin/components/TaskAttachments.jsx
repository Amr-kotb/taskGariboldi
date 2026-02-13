import React from 'react';
import './TaskAttachments.css';

const TaskAttachments = ({ attachments, taskId, userId, onDeleteAttachment }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="task-attachments">
      <h3 className="attachments-title">📎 Allegati ({attachments.length})</h3>
      <div className="attachments-grid">
        {attachments.map((attachment, index) => (
          <div key={index} className="attachment-card">
            <div className="attachment-icon-large">
              {getFileIcon(attachment.name)}
            </div>
            <div className="attachment-info">
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="attachment-name-link"
              >
                {attachment.name}
              </a>
              <div className="attachment-meta">
                <span className="attachment-size">
                  {formatFileSize(attachment.size)}
                </span>
                <span className="attachment-date">
                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {onDeleteAttachment && (
              <button
                onClick={() => onDeleteAttachment(taskId, attachment.path)}
                className="attachment-delete-btn"
                title="Elimina allegato"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskAttachments;