﻿import { getNodeDetail } from 'src/api/kc';
import chatController from 'src/api/chat';
import { updateNode, copyNode, addFile } from '../../../api/service';
import attachmentAjax from 'src/api/attachment';

const rejectErr = function (ajaxPromise) {
  const promise = $.Deferred();
  ajaxPromise
    .then((resp) => {
      if (!resp) {
        resp = {
          error: 'no response',
        };
      }
      if (resp.error) {
        promise.reject(resp.error);
      } else {
        promise.resolve(resp);
      }
    })
    .fail(() => {
      promise.reject();
    });
  return promise;
};

export function getKcNodeDetail(nodeId) {
  return getNodeDetail({ id: nodeId, actionType: 14 });
}

export function getPreviewLink(attachment) {
  return attachmentAjax.getPreviewLink({
    fileID: attachment.fileID,
    ext: attachment.ext,
    attachmentType: attachment.attachmentType,
  })
}

export function getChatPreviewLink(attachment) {
  return chatController.getPreviewLink(attachment);
}

export function fetchViewUrl(attachment) {
  const promise = $.Deferred();
  const param = {
    path: attachment.sourceNode.path,
    id: attachment.sourceNode.fileid,
    ext: attachment.ext,
  };
  getChatPreviewLink(param)
    .then((resp) => {
      if (!resp) {
        resp = {
          error: true,
        };
      }
      if (resp.error) {
        promise.reject('获取预览链接失败');
      } else {
        if (resp.viewUrl) {
          attachment.viewUrl = resp.viewUrl;
          attachment.previewType = resp.viewType;
        } else {
          promise.reject('获取预览链接失败');
        }
        promise.resolve(attachment);
      }
    })
    .fail((error) => {
      promise.reject('获取预览链接失败');
    });
  return promise;
}

export function renameFile(docVersionID, fileID, newName, ext, sourceID) {
  return rejectErr(
    attachmentAjax.update({
      fileName: newName,
      docVersionID,
      fileID,
      ext,
      sourceID,
    })
  );
}

export function renameKcFile(id, name, ext) {
  return rejectErr(
    updateNode({
      name: name + (ext ? '.' + ext : ''),
      id,
    })
  );
}

export function saveToKnowledge(fileId, toId, toRootId) {
  return rejectErr(
    attachmentAjax.saveToKnowledge({
      fileID: fileId,
      parentID: toId,
      rootID: toRootId,
    })
  );
}

export function kcCopyNode(ids, toId, toType, copySource) {
  return copyNode(ids, toId, toType, copySource);
}

export function kcAddFile(options) {
  return addFile(options);
}

export function deleteAttachment(docVersionID, fileID, sourceID, commentID, fromType, removeFromKC, visibleFileName) {
  return rejectErr(
    attachmentAjax.deleteAttachment({
      docVersionID,
      fileID,
      sourceID,
      commentID,
      fromType,
      removeFromKC,
      visibleFileName,
    })
  );
}

export function updateAllowDownload(docVersionID, allowDownload) {
  return rejectErr(
    attachmentAjax.update({
      docVersionID,
      allowDownload,
    })
  );
}
