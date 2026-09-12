import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import { 
  Info, 
  Plus, 
  Folder, 
  GripVertical, 
  ChevronDown, 
  ChevronRight, 
  Minus, 
  Image as ImageIcon, 
  Save, 
  Check, 
  ExternalLink,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Code,
  Link2,
  Table,
  Undo,
  Redo,
  Upload,
  Globe
} from 'lucide-react';

const INITIAL_TREE = [
  {
    id: 121,
    name: 'Jewellery',
    count: 0,
    isOpen: true,
    children: [
      { id: 125, name: 'Bangles', count: 27 },
      { id: 124, name: 'Bracelets', count: 0 },
      { id: 123, name: 'Rings', count: 13 },
      { id: 122, name: 'Necklaces', count: 34 },
      {
        id: 128,
        name: 'Gemstone',
        count: 10,
        isOpen: true,
        children: [
          { id: 129, name: 'Moissanite Stones', count: 10 }
        ]
      },
      { id: 154, name: 'Earrings', count: 34 }
    ]
  },
  {
    id: 113,
    name: 'Home & Living',
    count: 98,
    isOpen: true,
    children: [
      {
        id: 115,
        name: 'Spirituality & Religion',
        count: 98,
        isOpen: true,
        children: [
          {
            id: 116,
            name: 'Religious Home & Decor',
            count: 0,
            isOpen: false,
            children: [
              { id: 119, name: 'Chowkis', count: 0 },
              { id: 118, name: 'Thali & Thali Sets', count: 5 },
              { id: 117, name: 'Torans', count: 0 }
            ]
          },
          {
            id: 86,
            name: 'Religious Statuary Idols',
            count: 177,
            isOpen: true,
            children: [
              { id: 126, name: 'Marble Idols', count: 88 },
              {
                id: 127,
                name: 'Brass Idols',
                count: 265,
                isOpen: false,
                children: [
                  { id: 172, name: 'Kaal Bhairav Idols', count: 0 },
                  { id: 171, name: 'Saraswati', count: 0 },
                  { id: 170, name: 'Kaamdhenu Cow', count: 5 },
                  { id: 169, name: 'Lakshmi', count: 20 },
                  { id: 168, name: 'Parvati Idols', count: 18 },
                  { id: 167, name: 'Durga Ma', count: 46 },
                  { id: 166, name: 'Vishnu', count: 91 },
                  { id: 165, name: 'Hanuman', count: 76 },
                  { id: 164, name: 'Rama idols', count: 23 },
                  { id: 163, name: 'Krishna', count: 30 },
                  { id: 162, name: 'Ganesha', count: 64 },
                  { id: 161, name: 'Shiva', count: 63 },
                  { id: 160, name: 'Buddha', count: 10 }
                ]
              }
            ]
          }
        ]
      },
      { id: 84, name: 'Home Decor', count: 585 },
      { id: 85, name: 'Handicrafts', count: 717 }
    ]
  },
  {
    id: 104,
    name: 'Clothing',
    count: 0,
    isOpen: true,
    children: [
      {
        id: 108,
        name: "Girls' Clothing",
        count: 0,
        isOpen: false,
        children: [
          { id: 112, name: 'Tops & Tees', count: 0 },
          { id: 111, name: 'Pajamas & Robes', count: 0 },
          { id: 110, name: 'Jackets & Coats', count: 10 },
          { id: 109, name: "Baby Girls' Clothing", count: 0 }
        ]
      },
      {
        id: 107,
        name: "Boys' Clothing",
        count: 0,
        isOpen: false,
        children: [
          { id: 159, name: 'Kids Hunting Jackets', count: 0 }
        ]
      },
      {
        id: 106,
        name: "Men's Clothing",
        count: 1,
        isOpen: false,
        children: [
          { id: 140, name: 'Blazers', count: 21 },
          { id: 135, name: 'Jodhpuri Breeches (Riding Pants)', count: 25 },
          { id: 134, name: 'Kurtas', count: 60 },
          { id: 133, name: 'Suits and Jackets', count: 49 },
          { id: 132, name: 'Jodhpuri Achkans', count: 98 },
          { id: 131, name: 'Jodhpuri Waistcoat Sets', count: 4 },
          { id: 157, name: 'Hunting & Casual Shirt', count: 32 },
          { id: 156, name: 'Semi Hunting Jackets', count: 63 },
          { id: 130, name: 'Jodhpuri Bandhgala Suits', count: 17 }
        ]
      },
      {
        id: 105,
        name: "Women's Clothing",
        count: 26,
        isOpen: false,
        children: [
          { id: 139, name: 'Sarees', count: 24 },
          { id: 138, name: 'Real Silver Saree', count: 5 },
          { id: 137, name: 'Rajputi Poshak', count: 40 },
          { id: 136, name: 'Real Silver Poshak', count: 6 },
          { id: 158, name: 'Kurti & Tops', count: 0 }
        ]
      }
    ]
  },
  {
    id: 87,
    name: 'Accessories',
    count: 0,
    isOpen: false,
    children: [
      { id: 88, name: 'Sunglasses & Eyewear', count: 0 },
      { id: 93, name: 'Gloves & Mittens', count: 9 },
      { id: 92, name: 'Suit & Tie Accessories', count: 0 },
      { id: 91, name: 'Hair Accessories', count: 12 },
      { id: 90, name: 'Hats & Caps', count: 4 },
      { id: 89, name: 'Scarves & Wraps', count: 0 },
      {
        id: 141,
        name: "Groom's Accessories",
        count: 0,
        isOpen: false,
        children: [
          { id: 153, name: 'Lapel Pins', count: 8 },
          { id: 143, name: 'Crossbelt', count: 1 },
          { id: 152, name: 'Pocket Squares', count: 40 },
          { id: 151, name: 'Kurta Buttons', count: 15 },
          { id: 150, name: 'Cufflinks', count: 65 },
          { id: 149, name: 'Buttons', count: 0 },
          { id: 148, name: 'Safa / Head Turban', count: 24 },
          { id: 147, name: 'Woolen Beret Caps', count: 68 },
          { id: 146, name: 'Kamarbandh', count: 0 },
          { id: 145, name: 'Monogram', count: 16 },
          { id: 144, name: 'Kantha / Mala', count: 5 },
          { id: 142, name: 'Sarpech / Kilangi', count: 2 }
        ]
      }
    ]
  },
  {
    id: 94,
    name: 'Art & Collectibles',
    count: 0,
    isOpen: false,
    children: [
      { id: 96, name: 'Sculpture', count: 0 },
      { id: 95, name: 'Painting', count: 10 }
    ]
  },
  {
    id: 97,
    name: 'Bags & Purses',
    count: 0,
    isOpen: false,
    children: [
      { id: 103, name: 'Top Handle Bags', count: 7 },
      { id: 102, name: 'Crossbody Bags', count: 5 },
      { id: 101, name: 'Shoulder Bags', count: 10 },
      { id: 98, name: 'Handbags', count: 53 },
      { id: 100, name: 'Clutches & Evening Bags', count: 0 },
      { id: 99, name: 'Potli Bags', count: 10 }
    ]
  }
];

export const AdminEcommerceProductCategories = () => {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState(INITIAL_TREE);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [permalink, setPermalink] = useState('');
  const [parent, setParent] = useState('None');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Published');
  const [image, setImage] = useState('');
  const [fontIcon, setFontIcon] = useState('');
  const [iconImage, setIconImage] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const toggleNode = (id) => {
    const updateRecursive = (nodes) => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    setTreeData(updateRecursive(treeData));
  };

  const selectCategory = (category) => {
    setSelectedCategoryId(category.id);
    setName(category.name);
    setPermalink(category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!selectedCategoryId) {
      setPermalink(val.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
    }
  };

  const handleCreateNew = () => {
    setSelectedCategoryId(null);
    setName('');
    setPermalink('');
    setParent('None');
    setDescription('');
    setStatus('Published');
    setImage('');
    setFontIcon('');
    setIconImage('');
    setIsFeatured(false);
  };

  const handleSave = (exit = false) => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const renderTree = (nodes, level = 0) => {
    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-6 pl-2 border-l border-slate-200' : ''}`}>
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isSelected = selectedCategoryId === node.id;

          return (
            <div key={node.id} className="select-none">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => selectCategory(node)}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <GripVertical size={14} className="text-slate-400 cursor-grab flex-shrink-0" />
                  <Folder size={15} className="text-slate-400 flex-shrink-0" />
                  <span className="font-medium truncate text-[13px]">{node.name}</span>
                  <a
                    href={`/admin/ecommerce/products?category=${node.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/admin/ecommerce/products');
                    }}
                    className="text-blue-600 hover:underline text-[12px] font-normal flex-shrink-0"
                  >
                    ({node.count})
                  </a>
                </div>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
                  >
                    {node.isOpen ? <Minus size={13} /> : <Plus size={13} />}
                  </button>
                ) : (
                  <div className="w-5" />
                )}
              </div>

              {hasChildren && node.isOpen && (
                <div className="mt-1">
                  {renderTree(node.children, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <EcommerceLayout breadcrumb={['ECOMMERCE', 'PRODUCT CATEGORIES']}>
      <div className="p-6 bg-slate-50 min-h-screen">
        {/* Top Two Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Categories Tree */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Info notice */}
            <div className="bg-sky-50 border-l-4 border-sky-400 p-3.5 rounded-r flex items-start gap-2.5 text-sky-800 text-[13px] leading-relaxed">
              <Info size={16} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <span>Drag and drop on the left to change the order or parent of the categories.</span>
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateNew}
                className="bg-black text-white hover:bg-slate-800 px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus size={14} />
                Create
              </button>
            </div>

            {/* Tree Container */}
            <div className="bg-transparent">
              {renderTree(treeData)}
            </div>
          </div>

          {/* RIGHT COLUMN: Edit/Create Form */}
          <div className="col-span-12 lg:col-span-7 space-y-5">
            {/* Alert */}
            <div className="bg-sky-50 border-l-4 border-sky-400 p-3.5 rounded-r flex items-center gap-2 text-sky-800 text-[13px]">
              <Info size={16} className="text-sky-500 flex-shrink-0" />
              <span>You are editing <strong className="font-semibold text-sky-900">"English"</strong> version</span>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              {/* Permalink */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Permalink <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center text-sm border border-slate-300 rounded overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="bg-slate-100 text-slate-500 px-3 py-2 text-xs border-r border-slate-200 select-none">
                    https://jaipurio.in/product-categories/
                  </span>
                  <input
                    type="text"
                    value={permalink}
                    onChange={(e) => setPermalink(e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none text-slate-800"
                    placeholder="category-slug"
                  />
                </div>
              </div>

              {/* Parent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Parent
                </label>
                <select
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="None">None</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Art & Collectibles">Art & Collectibles</option>
                  <option value="Bags & Purses">Bags & Purses</option>
                </select>
              </div>

              {/* Description & Rich Text Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Description
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Show/Hide Editor
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-1"
                    >
                      <ImageIcon size={13} />
                      Add media
                    </button>
                  </div>
                </div>

                {/* Editor Container */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  {/* Toolbar */}
                  <div className="bg-slate-100 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1 text-slate-600 text-xs">
                    <select className="bg-transparent border border-slate-300 rounded px-1.5 py-0.5 text-xs">
                      <option>Paragraph</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                      <option>Heading 3</option>
                    </select>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button type="button" className="p-1 hover:bg-slate-200 rounded font-bold"><Bold size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded italic"><Italic size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded underline"><Underline size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded line-through"><Strikethrough size={13} /></button>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><List size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><ListOrdered size={13} /></button>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><AlignLeft size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><AlignCenter size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><AlignRight size={13} /></button>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Link2 size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Table size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Code size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Undo size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Redo size={13} /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Maximize2 size={13} /></button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter category description..."
                    className="w-full p-3 text-sm outline-none text-slate-800 resize-y"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden">
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <button type="button" className="text-blue-600 hover:underline font-medium block">
                      Choose image
                    </button>
                    <span className="text-slate-400">or</span>
                    <button type="button" className="text-blue-600 hover:underline font-medium block">
                      Add from URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Icon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Font Icon
                </label>
                <input
                  type="text"
                  placeholder="-- None --"
                  value={fontIcon}
                  onChange={(e) => setFontIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              {/* Icon Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Icon image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden">
                    {iconImage ? (
                      <img src={iconImage} alt="Icon preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <button type="button" className="text-blue-600 hover:underline font-medium block">
                      Choose image
                    </button>
                    <span className="text-slate-400">or</span>
                    <button type="button" className="text-blue-600 hover:underline font-medium block">
                      Add from URL
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  It will replace Icon Font if it is present.
                </p>
              </div>

              {/* Is Featured */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                  Is featured?
                </label>
              </div>
            </div>

            {/* Search Engine Optimize Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">
                  Search Engine Optimize
                </h4>
                <button type="button" className="text-xs text-blue-600 hover:underline font-medium">
                  Edit SEO meta
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setup meta title & description to make your site easy to discovered on search engines such as Google
              </p>
            </div>

            {/* Publish Actions Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Publish
              </h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check size={14} />
                  Save & Exit
                </button>
                {isSaved && (
                  <span className="text-emerald-600 text-xs font-medium">
                    ✓ Saved successfully
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCategories;
