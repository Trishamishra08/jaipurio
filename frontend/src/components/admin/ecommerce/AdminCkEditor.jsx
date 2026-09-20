import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Font,
  Highlight,
  Link,
  AutoLink,
  List,
  Alignment,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageUpload,
  ImageResize,
  ImageInsert,
  ImageInsertViaUrl,
  AutoImage,
  PictureEditing,
  CodeBlock,
  SourceEditing,
  RemoveFormat,
  Undo,
  GeneralHtmlSupport,
  HtmlEmbed,
  ShowBlocks,
  Fullscreen,
  Autoformat,
  PasteFromOffice,
  Plugin,
  ButtonView,
  IconBrowseFiles,
  IconRefresh,
  IconObjectCenter,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { FiImage } from 'react-icons/fi';
import api from '../../../utils/api';
import MediaGalleryModal from './MediaGalleryModal';
import MediaUrlInsertModal from './MediaUrlInsertModal';

const uploadFileToApi = async (file) => {
  const formData = new FormData();
  formData.append('documents', file);
  const res = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data = res.data?.data;
  const first = Array.isArray(data) ? data[0] : data;
  const url = typeof first === 'string' ? first : first?.url;
  if (!url || typeof url !== 'string') {
    throw new Error('Upload did not return a URL');
  }
  return url;
};

function AdminUploadAdapter(loader) {
  this.loader = loader;
}

AdminUploadAdapter.prototype.upload = function upload() {
  return this.loader.file.then((file) => uploadFileToApi(file).then((url) => ({ default: url })));
};

AdminUploadAdapter.prototype.abort = function abort() {};

class AdminUploadAdapterPlugin extends Plugin {
  static get pluginName() {
    return 'AdminUploadAdapterPlugin';
  }

  init() {
    this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
      new AdminUploadAdapter(loader);
  }
}

/** Folder (+) — browse & insert image/file like Botble media library. */
class BrowseFilesPlugin extends Plugin {
  static get pluginName() {
    return 'BrowseFilesPlugin';
  }

  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add('browseFiles', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'Browse files',
        icon: IconBrowseFiles,
        tooltip: true,
      });
      view.on('execute', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,.pdf';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const url = await uploadFileToApi(file);
            const isImage = file.type.startsWith('image/');
            editor.model.change((writer) => {
              if (isImage) {
                const imageElement = writer.createElement('imageBlock', { src: url });
                editor.model.insertContent(imageElement, editor.model.document.selection);
              } else {
                const linkText = file.name || url;
                editor.model.insertContent(
                  writer.createText(linkText, { linkHref: url }),
                  editor.model.document.selection
                );
              }
            });
          } catch (err) {
            window.alert(err?.message || 'Upload failed');
          }
        };
        input.click();
      });
      return view;
    });
  }
}

/** UI Blocks — insert a shortcode placeholder (Botble-style). */
class UiBlocksPlugin extends Plugin {
  static get pluginName() {
    return 'UiBlocksPlugin';
  }

  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add('uiBlocks', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'UI Blocks',
        icon: IconObjectCenter,
        tooltip: true,
        withText: true,
      });
      view.on('execute', () => {
        const name = window.prompt(
          'UI Block shortcode name (e.g. gallery, banner, cta)',
          'gallery'
        );
        if (!name) return;
        editor.model.change((writer) => {
          editor.model.insertContent(
            writer.createText(`[${name.trim()}]`),
            editor.model.document.selection
          );
        });
      });
      return view;
    });
  }
}

/** Refresh — restore last saved HTML snapshot. */
class RefreshContentPlugin extends Plugin {
  static get pluginName() {
    return 'RefreshContentPlugin';
  }

  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add('refreshContent', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'Refresh content',
        icon: IconRefresh,
        tooltip: true,
      });
      view.on('execute', () => {
        const snapshot = editor.config.get('adminRefreshSnapshot') || editor._adminRefreshSnapshot;
        if (typeof snapshot === 'string' && window.confirm('Reload content from last saved version?')) {
          editor.setData(snapshot);
        }
      });
      return view;
    });
  }
}

const EDITOR_PLUGINS = [
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Font,
  Highlight,
  Link,
  AutoLink,
  List,
  Alignment,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageUpload,
  ImageResize,
  ImageInsert,
  ImageInsertViaUrl,
  AutoImage,
  PictureEditing,
  CodeBlock,
  SourceEditing,
  RemoveFormat,
  Undo,
  GeneralHtmlSupport,
  HtmlEmbed,
  ShowBlocks,
  Fullscreen,
  Autoformat,
  PasteFromOffice,
  AdminUploadAdapterPlugin,
  BrowseFilesPlugin,
  UiBlocksPlugin,
  RefreshContentPlugin,
];

/**
 * Botble 2-row toolbar. Official CKEditor `'-'` creates a hard line break.
 * Keep row 1 compact so it does not wrap before the break.
 */
const TOOLBAR_ITEMS = [
  // Row 1
  'heading',
  '|',
  'fontColor',
  'fontSize',
  'fontBackgroundColor',
  'fontFamily',
  '|',
  'bold',
  'italic',
  'underline',
  'link',
  'strikethrough',
  '|',
  'bulletedList',
  'numberedList',
  '|',
  'alignment',
  'showBlocks',
  'uiBlocks',
  '|',
  'outdent',
  'indent',
  // Hard break → row 2
  '-',
  // Row 2
  'htmlEmbed',
  'insertImage',
  'browseFiles',
  'blockQuote',
  'insertTable',
  'mediaEmbed',
  '|',
  'undo',
  'redo',
  'refreshContent',
  'removeFormat',
  'sourceEditing',
  'codeBlock',
  'fullscreen',
];

/**
 * Botble-style CKEditor 5 wrapper for admin content fields.
 */
export default function AdminCkEditor({
  value = '',
  onChange,
  placeholder = 'Start writing…',
  minHeight = 140,
  label,
  showUiBlocksHint = false,
  editorKey,
  defaultVisible = true,
}) {
  const [visible, setVisible] = useState(Boolean(defaultVisible));
  const [urlPromptOpen, setUrlPromptOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editorError, setEditorError] = useState('');
  const editorRef = useRef(null);
  const refreshSnapshotRef = useRef(value || '');
  const suppressChangeRef = useRef(true);

  // Always show rich editor when the field remounts (e.g. product load)
  useEffect(() => {
    setVisible(Boolean(defaultVisible));
    setEditorError('');
    suppressChangeRef.current = true;
  }, [editorKey, defaultVisible]);

  // Keep CKEditor in sync when parent loads seeded HTML after mount
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return undefined;
    const next = value || '';
    let current = '';
    try {
      current = editor.getData() || '';
    } catch {
      return undefined;
    }
    if (next === current) return undefined;
    suppressChangeRef.current = true;
    editor.setData(next);
    const t = window.setTimeout(() => {
      suppressChangeRef.current = false;
    }, 0);
    return () => window.clearTimeout(t);
  }, [value, editorKey]);

  const config = useMemo(
    () => ({
      licenseKey: 'GPL',
      plugins: EDITOR_PLUGINS,
      toolbar: {
        items: TOOLBAR_ITEMS,
        shouldNotGroupWhenFull: true,
      },
      adminRefreshSnapshot: refreshSnapshotRef.current,
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        ],
      },
      fontSize: {
        options: [10, 12, 14, 'default', 16, 18, 20, 24, 28, 32],
        supportAllValues: true,
      },
      fontFamily: {
        options: [
          'default',
          'Arial, Helvetica, sans-serif',
          'Georgia, serif',
          'Times New Roman, Times, serif',
          'Verdana, Geneva, sans-serif',
          'Courier New, Courier, monospace',
          'Tahoma, Geneva, sans-serif',
        ],
        supportAllValues: true,
      },
      image: {
        toolbar: [
          'imageTextAlternative',
          'toggleImageCaption',
          'imageStyle:inline',
          'imageStyle:block',
          'imageStyle:side',
          '|',
          'resizeImage',
        ],
        insert: {
          // Upload only in toolbar — URL + gallery are handled via "Add media"
          integrations: ['upload'],
        },
      },
      table: {
        contentToolbar: [
          'tableColumn',
          'tableRow',
          'mergeTableCells',
          'tableProperties',
          'tableCellProperties',
        ],
      },
      htmlEmbed: {
        showPreviews: true,
      },
      htmlSupport: {
        allow: [
          {
            name: /.*/,
            attributes: true,
            classes: true,
            styles: true,
          },
        ],
      },
      mediaEmbed: {
        previewsInData: true,
      },
      fullscreen: {
        menuBar: {
          isVisible: true,
        },
      },
      placeholder,
    }),
    [placeholder]
  );

  const insertImageSrc = (src, alt = '') => {
    if (!src || !editorRef.current) return;
    editorRef.current.model.change((writer) => {
      const imageElement = writer.createElement('imageBlock', {
        src,
        alt: alt || '',
      });
      editorRef.current.model.insertContent(
        imageElement,
        editorRef.current.model.document.selection
      );
    });
  };

  const insertFromGallery = (asset) => {
    insertImageSrc(asset?.url, asset?.alt || asset?.name || '');
  };

  return (
    <div className="admin-ckeditor space-y-1.5">
      <div className="flex items-center justify-between mb-1.5">
        {label ? <label className="text-xs font-bold text-slate-700">{label}</label> : <span />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-0.5 rounded-sm bg-slate-50"
          >
            Show/Hide Editor
          </button>
          <button
            type="button"
            onClick={() => setUrlPromptOpen(true)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <FiImage size={12} /> Add media
          </button>
        </div>
      </div>

      <MediaUrlInsertModal
        open={urlPromptOpen}
        onClose={() => setUrlPromptOpen(false)}
        onInsertUrl={(url) => insertImageSrc(url)}
        onOpenGallery={() => setGalleryOpen(true)}
      />

      <MediaGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onInsert={insertFromGallery}
      />

      {visible ? (
        <div
          className="border border-slate-300 rounded-md overflow-hidden bg-white admin-ckeditor-shell"
          style={{ '--ck-min-height': `${minHeight}px` }}
        >
          {editorError ? (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">
              Editor failed to load: {editorError}
            </div>
          ) : null}
          <CKEditor
            key={editorKey || 'ck-editor'}
            editor={ClassicEditor}
            data={value || ''}
            config={config}
            onReady={(editor) => {
              setEditorError('');
              editorRef.current = editor;
              suppressChangeRef.current = true;
              const initial = value || '';
              try {
                if ((editor.getData() || '') !== initial) {
                  editor.setData(initial);
                }
              } catch {
                /* ignore init race */
              }
              refreshSnapshotRef.current = initial;
              editor._adminRefreshSnapshot = refreshSnapshotRef.current;
              const editable = editor.ui.view.editable.element;
              if (editable) {
                editable.style.minHeight = `${minHeight}px`;
              }
              window.setTimeout(() => {
                suppressChangeRef.current = false;
              }, 0);
            }}
            onError={(err, { willEditorRestart }) => {
              const msg = err?.message || String(err) || 'Unknown CKEditor error';
              console.error('AdminCkEditor error:', err);
              if (!willEditorRestart) setEditorError(msg);
            }}
            onChange={(_event, editor) => {
              if (suppressChangeRef.current) return;
              onChange?.(editor.getData());
            }}
          />
        </div>
      ) : (
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          rows={Math.max(4, Math.round(minHeight / 24))}
          className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
          placeholder="HTML source (editor hidden)"
        />
      )}

      <style>{`
        .admin-ckeditor-shell .ck-editor__editable {
          min-height: var(--ck-min-height, 140px);
          font-size: 13px;
          line-height: 1.55;
        }
        .admin-ckeditor-shell .ck.ck-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          background: #f1f5f9 !important;
          padding: 2px 4px !important;
          gap: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar > .ck-toolbar__items {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          column-gap: 0 !important;
          row-gap: 1px !important;
          width: 100% !important;
        }
        /* Official CKEditor multi-line break ('-') */
        .admin-ckeditor-shell .ck.ck-toolbar .ck-toolbar__line-break,
        .admin-ckeditor-shell .ck.ck-toolbar .ck-toolbar__newline {
          flex-basis: 100% !important;
          width: 100% !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-toolbar__items > * {
          margin: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-button,
        .admin-ckeditor-shell .ck.ck-toolbar .ck-dropdown__button {
          min-width: 24px !important;
          min-height: 24px !important;
          padding: 1px !important;
          margin: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-button .ck-icon,
        .admin-ckeditor-shell .ck.ck-toolbar .ck-dropdown__button .ck-icon {
          width: 16px !important;
          height: 16px !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-dropdown {
          margin: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-heading-dropdown .ck-button .ck-button__label {
          max-width: 72px !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-button.ck-button_with-text {
          padding-left: 3px !important;
          padding-right: 4px !important;
          gap: 2px !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-button.ck-button_with-text .ck-button__label {
          font-size: 10px !important;
          line-height: 1 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-source-editing-button .ck-button__label {
          font-size: 10px !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-toolbar__separator {
          margin: 0 1px !important;
          height: 16px !important;
          align-self: center !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-splitbutton {
          margin: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-toolbar .ck-splitbutton > .ck-button {
          margin: 0 !important;
        }
        .admin-ckeditor-shell .ck.ck-editor__main > .ck-editor__editable {
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
        }
        .admin-ckeditor-shell .ck-content img {
          max-width: 100%;
          height: auto;
        }
        .admin-ckeditor-shell .ck-fullscreen__main-wrapper,
        .admin-ckeditor-shell.ck-fullscreen {
          z-index: 10050;
        }
      `}</style>
    </div>
  );
}
