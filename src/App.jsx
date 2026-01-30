import React, { useState, useMemo, useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  FileText, 
  Ruler, 
  Car, 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  Info, 
  AlertTriangle,
  Package,
  Menu,
  Grid,
  List,
  Database,
  Filter,
  ChevronRight,
  X,
  SlidersHorizontal,
  Download,
  Upload,
  Edit3,
  Save,
  Clock,
  User,
  History,
  Trash2,
  Plus,
  FileSpreadsheet
} from 'lucide-react';

// --- UTILIDADES ---
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// --- PARSER CSV A JSON (NUEVO) ---
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Regex compleja para manejar comas dentro de comillas (ej: "Toyota, Inc")
    const obj = {};
    const currentline = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');

    headers.forEach((header, index) => {
      let val = currentline[index] ? currentline[index].replace(/^"|"$/g, '').trim() : '';
      obj[header] = val;
    });

    // Mapeo inteligente de CSV plano a Estructura Compleja de la App
    if (obj.sku) { // Solo si tiene SKU
        const newProduct = {
            id: Date.now() + i,
            sku: obj.sku || 'SIN-SKU',
            name: obj.name || 'Producto Nuevo',
            brand: obj.brand || 'Genérico',
            category: obj.category || 'General',
            oem_ref: obj.oem_ref || '',
            line: obj.line || '',
            description: obj.description || '',
            image_preview: obj.image_url || 'https://placehold.co/400x400/0f172a/fbbf24?text=NO+IMG',
            // Reconstruimos la estructura anidada
            quickSpecs: {
                info: obj.specs_info || ''
            },
            specs: [
                { label: "Origen", value: "Importado (CSV)" }
            ],
            // Asumimos que el CSV trae al menos un vehículo principal
            applications: obj.make ? [{
                make: obj.make,
                model: obj.model || 'Varios',
                engine: obj.engine || '',
                years: obj.year || 'Todos'
            }] : [],
            crossReference: [],
            images: []
        };
        result.push(newProduct);
    }
  }
  return result;
};

// --- COMPONENTE DE FILTROS INTELIGENTES (CASCADA) ---
const SmartFilters = ({ db, filters, onFilterChange, vertical = false }) => {
  
  const availableMakes = useMemo(() => {
    const makes = new Set();
    db.forEach(p => p.applications?.forEach(app => makes.add(app.make)));
    return Array.from(makes).sort();
  }, [db]);

  const availableModels = useMemo(() => {
    if (!filters.make) return [];
    const models = new Set();
    db.forEach(p => {
      p.applications?.forEach(app => {
        if (app.make === filters.make) {
          models.add(app.model);
        }
      });
    });
    return Array.from(models).sort();
  }, [db, filters.make]);

  const availableYears = useMemo(() => {
    if (!filters.make || !filters.model) return [];
    const years = new Set();
    db.forEach(p => {
      p.applications?.forEach(app => {
        if (app.make === filters.make && app.model === filters.model) {
          years.add(app.years);
        }
      });
    });
    return Array.from(years).sort();
  }, [db, filters.make, filters.model]);

  const availableCategories = useMemo(() => {
    let relevantProducts = db;
    if (filters.make) {
      relevantProducts = relevantProducts.filter(p => 
        p.applications?.some(a => a.make === filters.make && (!filters.model || a.model === filters.model))
      );
    }
    const cats = new Set(relevantProducts.map(p => p.category));
    return Array.from(cats).sort();
  }, [db, filters.make, filters.model]);

  const containerClass = vertical 
    ? "flex flex-col gap-4 w-full" 
    : "grid grid-cols-1 md:grid-cols-4 gap-4 w-full";

  const selectClass = "w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 shadow-sm disabled:bg-slate-800 disabled:text-slate-600 transition-all";
  const labelClass = "block mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider";

  return (
    <div className={containerClass}>
      <div className="w-full">
        <label className={labelClass}>Marca</label>
        <select 
          value={filters.make} 
          onChange={(e) => onFilterChange('make', e.target.value)}
          className={selectClass}
        >
          <option value="">Todas las marcas</option>
          {availableMakes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      <div className="w-full">
        <label className={labelClass}>Modelo</label>
        <select 
          value={filters.model} 
          onChange={(e) => onFilterChange('model', e.target.value)}
          className={selectClass}
          disabled={!filters.make}
        >
          <option value="">{filters.make ? 'Seleccionar Modelo' : '---'}</option>
          {availableModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="w-full">
        <label className={labelClass}>Año / Rango</label>
        <select 
          value={filters.year} 
          onChange={(e) => onFilterChange('year', e.target.value)}
          className={selectClass}
          disabled={!filters.model}
        >
          <option value="">{filters.model ? 'Todos los años' : '---'}</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="w-full">
        <label className={labelClass}>Categoría</label>
        <select 
          value={filters.category} 
          onChange={(e) => onFilterChange('category', e.target.value)}
          className={selectClass}
        >
          <option value="">Todas</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// --- MODAL DE EDICIÓN DE PRODUCTO ---
const ProductEditModal = ({ product, isOpen, onClose, onSave, currentUser }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (product) {
      setFormData(JSON.parse(JSON.stringify(product))); // Deep copy
    } else {
        // Default empty product
        setFormData({
            sku: '', name: '', brand: '', category: '', oem_ref: '', line: '', description: '',
            image_preview: 'https://placehold.co/400x400/0f172a/fbbf24?text=NEW',
            quickSpecs: {}, specs: [], applications: [], crossReference: [], images: []
        });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, currentUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-amber-500/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" />
            {product ? `Editar: ${product.sku}` : 'Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / Código</label>
              <input required name="sku" value={formData.sku || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">OEM Ref</label>
              <input name="oem_ref" value={formData.oem_ref || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Producto</label>
            <input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
              <input required name="brand" value={formData.brand || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
              <input required name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
             <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none text-sm"></textarea>
          </div>
          
          <div className="p-3 bg-amber-50 rounded text-xs text-amber-800 border border-amber-200 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Nota: Para editar especificaciones técnicas complejas o aplicaciones, use la carga masiva CSV/JSON. Esta edición es rápida.
          </div>
        </form>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900">Cancelar</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded shadow-lg transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE TARJETA DE PRODUCTO ---
const ProductCard = ({ product, onClick, viewMode }) => {
  return (
    <div 
      onClick={onClick}
      className={`group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-amber-400 transition-all duration-300 cursor-pointer flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'}`}
    >
      <div className={`${viewMode === 'list' ? 'w-48 h-full' : 'w-full h-48'} bg-slate-900 relative overflow-hidden flex items-center justify-center p-4 group-hover:bg-slate-800 transition-colors`}>
        <img 
          src={product.image_preview} 
          alt={product.sku}
          className="max-w-full max-h-full object-contain mix-blend-normal group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/0f172a/fbbf24?text=NO+IMG"; }}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-amber-500 text-slate-900 p-1.5 rounded-full shadow-lg block">
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div className={`p-5 flex flex-col flex-grow ${viewMode === 'list' ? 'justify-center' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
            {product.brand}
          </span>
          <span className="text-xs font-mono text-slate-400">{product.category}</span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors mb-1">
          {product.sku}
        </h3>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {product.name}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 mb-0.5">OEM Ref:</span>
            <span className="font-mono font-medium text-slate-700">{product.oem_ref}</span>
          </div>
          {viewMode !== 'list' && (
            <button className="text-amber-600 font-medium text-xs hover:underline flex items-center gap-1">
              Ver Ficha <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- VISTA DETALLE CON HISTORIAL ---
const ProductDetail = ({ product, onBack, onEdit, historyLog }) => {
  const [activeTab, setActiveTab] = useState('specs');
  
  if (!product) return null;

  // Filtrar historial solo para este producto
  const productHistory = historyLog.filter(h => h.sku === product.sku).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a resultados
        </button>
        <button 
          onClick={() => onEdit(product)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-bold transition-colors"
        >
          <Edit3 className="w-4 h-4" /> Editar Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Producto GALAXY BLUE */}
        <div className="bg-slate-900 text-white p-8 relative overflow-hidden border-b-4 border-amber-500">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg">{product.brand}</span>
                <span className="bg-slate-700 text-slate-300 text-xs font-medium px-2 py-1 rounded border border-slate-600">{product.category}</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-white">{product.sku}</h1>
              <p className="text-slate-300 text-lg font-light">{product.name}</p>
            </div>
            <div className="flex gap-3 items-start">
               <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm transition-all text-slate-300">
                <Printer className="w-4 h-4" /> Imprimir
               </button>
               <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-amber-900/20 transition-all">
                <Share2 className="w-4 h-4" /> Compartir
               </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Columna Izquierda */}
          <div className="w-full lg:w-1/3 p-6 border-r border-slate-200 bg-slate-50">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6 flex items-center justify-center min-h-[250px]">
              <img src={product.image_preview} alt={product.sku} className="w-full h-auto object-contain max-h-[300px]" 
                   onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/0f172a/fbbf24?text=NO+IMG"; }}
              />
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Ruler className="w-4 h-4 text-amber-500" /> Especificaciones Clave
              </h3>
              <div className="space-y-3">
                {product.quickSpecs && Object.entries(product.quickSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 capitalize">{key}</span>
                    <span className="font-mono font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="w-full lg:w-2/3">
             <div className="flex border-b border-slate-200 bg-white">
               {[
                 { id: 'specs', label: 'Ficha Técnica', icon: FileText },
                 { id: 'apps', label: 'Compatibilidad', icon: Car },
                 { id: 'cross', label: 'Cruce OEM', icon: RefreshCw },
                 { id: 'history', label: 'Auditoría', icon: History },
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex-1 py-4 text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? 'border-amber-500 text-slate-900 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-500' : ''}`} /> {tab.label}
                 </button>
               ))}
             </div>

             <div className="p-8 min-h-[400px] bg-white">
               {activeTab === 'specs' && (
                 <div className="space-y-6">
                   <div>
                     <h3 className="font-bold text-slate-900 mb-3">Descripción Detallada</h3>
                     <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                       {product.description || "Sin descripción disponible."}
                     </p>
                   </div>
                   {product.specs && (
                     <div>
                       <h3 className="font-bold text-slate-900 mb-3">Tabla Técnica</h3>
                       <table className="w-full text-sm">
                         <tbody className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden block">
                           {product.specs.map((spec, i) => (
                             <tr key={i} className="flex">
                               <td className="w-1/3 bg-slate-50 p-3 font-medium text-slate-600">{spec.label}</td>
                               <td className="w-2/3 p-3 text-slate-800">{spec.value}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </div>
               )}

               {activeTab === 'apps' && (
                 <div>
                   <h3 className="font-bold text-slate-900 mb-4">Vehículos Compatibles</h3>
                   {product.applications && product.applications.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <tr>
                            <th className="py-3 px-4">Marca</th>
                            <th className="py-3 px-4">Modelo</th>
                            <th className="py-3 px-4">Motor</th>
                            <th className="py-3 px-4">Años</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {product.applications.map((app, i) => (
                            <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{app.make}</td>
                                <td className="py-3 px-4 text-slate-600">{app.model}</td>
                                <td className="py-3 px-4 text-slate-500">{app.engine}</td>
                                <td className="py-3 px-4 font-mono text-xs text-amber-600 bg-amber-50">{app.years}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                   ) : (
                       <p className="text-slate-400 italic">No hay aplicaciones registradas.</p>
                   )}
                 </div>
               )}

               {activeTab === 'cross' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                      <span className="text-xs font-bold text-amber-600 uppercase block mb-1">OEM / Original</span>
                      <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{product.oem_ref}</span>
                    </div>
                    {product.crossReference && product.crossReference.map((ref, i) => (
                      <div key={i} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center group hover:border-amber-400 transition-colors">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">{ref.brand}</span>
                          <span className="text-lg font-bold text-slate-700 font-mono">{ref.part}</span>
                        </div>
                        <RefreshCw className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                      </div>
                    ))}
                 </div>
               )}

               {activeTab === 'history' && (
                   <div className="animate-in fade-in duration-300">
                       <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                           <Clock className="w-4 h-4 text-slate-400" /> Historial de Modificaciones
                       </h3>
                       {productHistory.length > 0 ? (
                           <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                               {productHistory.map((log, idx) => (
                                   <div key={idx} className="ml-6 relative">
                                       <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-1 ring-slate-200"></span>
                                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                           <span className="text-sm font-bold text-slate-800">{log.action}</span>
                                           <span className="text-xs text-slate-400 font-mono">{formatDate(log.date)}</span>
                                       </div>
                                       <p className="text-xs text-slate-500 mb-1">Por: <span className="font-medium text-slate-700">{log.user}</span></p>
                                       {log.details && (
                                           <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 font-mono border border-slate-100">
                                               {log.details}
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                               <p>No hay registros de cambios para este producto.</p>
                           </div>
                       )}
                   </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- VISTA BASE DE DATOS (TABULAR) ---
const DatabaseView = ({ db, filters, onFilterChange, onEdit, historyLog }) => {
  const filteredData = useMemo(() => {
    return db.filter(item => {
      const matchesVehicle = item.applications?.some(app => {
        const makeMatch = !filters.make || app.make === filters.make;
        const modelMatch = !filters.model || app.model === filters.model;
        const yearMatch = !filters.year || app.years === filters.year;
        return makeMatch && modelMatch && yearMatch;
      });

      const catMatch = !filters.category || item.category === filters.category;
      
      const text = filters.search?.toLowerCase() || '';
      const textMatch = !text || 
        item.sku.toLowerCase().includes(text) || 
        item.name.toLowerCase().includes(text) ||
        item.oem_ref.toLowerCase().includes(text);

      return (item.applications ? matchesVehicle : true) && catMatch && textMatch;
    });
  }, [db, filters]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" />
            Inventario Maestro
          </h2>
          <div className="text-xs text-slate-500">
            Registros: <span className="font-bold text-slate-800">{filteredData.length}</span>
          </div>
        </div>
        
        <div className="p-4 bg-white border-b border-slate-100">
           <SmartFilters db={db} filters={filters} onFilterChange={onFilterChange} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">OEM</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aplicaciones</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Modificado</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredData.map((product) => {
                  const lastMod = historyLog.filter(h => h.sku === product.sku).sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                  return (
                    <tr key={product.id || product.sku} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-600">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="px-2 py-1 rounded bg-slate-100 text-xs font-semibold">{product.brand}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{product.oem_ref}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex -space-x-2 overflow-hidden max-w-[150px]">
                        {product.applications && product.applications.slice(0,3).map((a,i) => (
                            <div key={i} className="inline-block px-2 py-0.5 bg-slate-100 border border-white rounded-full text-[10px] z-0">
                            {a.make}
                            </div>
                        ))}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                         {lastMod ? (
                             <div>
                                 <div>{formatDate(lastMod.date).split(',')[0]}</div>
                                 <div className="text-[10px]">{lastMod.user}</div>
                             </div>
                         ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => onEdit(product)} className="text-slate-400 hover:text-amber-600 p-2 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                        </button>
                    </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && (
             <div className="text-center py-12 text-slate-400">
               No hay resultados que coincidan con los filtros seleccionados.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const AutoCatalogApp = () => {
  const [currentView, setCurrentView] = useState('search'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentUser, setCurrentUser] = useState('Admin'); // Simulador de usuario
  
  // ESTADO DE LA BASE DE DATOS (Vacía por defecto)
  const [db, setDb] = useState([]);
  
  // ESTADO DE HISTORIAL
  const [historyLog, setHistoryLog] = useState([]);
  
  // ESTADO DE MODALES
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [filters, setFilters] = useState({
    make: '', model: '', year: '', category: '', search: ''
  });

  // --- MANEJO DE ARCHIVOS (CARGA JSON Y CSV) ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      const fileName = file.name.toLowerCase();

      reader.onload = (e) => {
        try {
          let newData = [];
          if (fileName.endsWith('.csv')) {
              // Parsear CSV
              newData = parseCSV(e.target.result);
          } else if (fileName.endsWith('.json')) {
              // Parsear JSON
              const json = JSON.parse(e.target.result);
              if (Array.isArray(json)) newData = json;
          } else {
              alert("Formato no soportado. Use .csv (Excel) o .json");
              return;
          }

          if (newData.length > 0) {
            setDb(newData);
            // Log de carga inicial
            setHistoryLog(prev => [...prev, {
                date: new Date().toISOString(),
                user: currentUser,
                sku: 'SISTEMA',
                action: 'CARGA MASIVA',
                details: `Se cargaron ${newData.length} productos desde ${fileName}.`
            }]);
            alert(`Base de datos cargada con éxito: ${newData.length} productos.`);
          } else {
            alert("El archivo parece estar vacío o tiene un formato incorrecto.");
          }
        } catch (error) {
          console.error(error);
          alert("Error al leer el archivo. Revise el formato.");
        }
      };
      
      reader.readAsText(file);
    }
  };

  // --- MANEJO DE EDICIÓN ---
  const handleEditClick = (product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (updatedProduct, user) => {
      let actionType = 'ACTUALIZACIÓN';
      
      setDb(prevDb => {
          const index = prevDb.findIndex(p => p.sku === updatedProduct.sku);
          if (index >= 0) {
              // Actualizar existente
              const newDb = [...prevDb];
              newDb[index] = updatedProduct;
              return newDb;
          } else {
              // Nuevo producto (si implementas botón crear)
              actionType = 'CREACIÓN';
              return [...prevDb, { ...updatedProduct, id: Date.now() }];
          }
      });

      // Registrar en Historial
      setHistoryLog(prev => [...prev, {
          date: new Date().toISOString(),
          user: user,
          sku: updatedProduct.sku,
          action: actionType,
          details: `Modificación manual de campos.`
      }]);
  };

  // Handler centralizado de cambio de filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'make') { newFilters.model = ''; newFilters.year = ''; }
      if (key === 'model') { newFilters.year = ''; }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({ make: '', model: '', year: '', category: '', search: '' });
  };

  const filteredProducts = useMemo(() => {
    return db.filter(product => {
      const searchTerm = filters.search.toLowerCase();
      const matchesText = !searchTerm || 
        product.sku.toLowerCase().includes(searchTerm) || 
        product.name.toLowerCase().includes(searchTerm) || 
        product.oem_ref.toLowerCase().includes(searchTerm) ||
        product.crossReference?.some(c => c.part.toLowerCase().includes(searchTerm));

      const matchesVehicle = product.applications?.some(app => {
        const makeMatch = !filters.make || app.make === filters.make;
        const modelMatch = !filters.model || app.model === filters.model;
        const yearMatch = !filters.year || app.years === filters.year;
        return makeMatch && modelMatch && yearMatch;
      });

      const matchesCategory = !filters.category || product.category === filters.category;

      return matchesText && (product.applications ? matchesVehicle : true) && matchesCategory;
    });
  }, [filters, db]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentView('detail');
    window.scrollTo(0,0);
  };

  // DOWNLOAD EJEMPLO CSV
  const downloadSampleCSV = () => {
    const csvContent = "sku,name,brand,category,oem_ref,description,image_url,make,model,year,engine\n" + 
    "FIL-001,Filtro de Aceite Premium,Toyota,Motor,90915-YZZF1,Filtro de alto flujo,https://placehold.co/400x400,TOYOTA,Corolla,2015,1.8L";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_carga.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* HEADER GALAXY BLUE */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('search')}>
              <div className="bg-amber-500 p-2 rounded-lg shadow-lg shadow-amber-500/20 group-hover:bg-amber-400 transition-colors">
                <Database className="w-5 h-5 text-slate-900" />
              </div>
              <div className="leading-none">
                <h1 className="font-black text-xl tracking-tight text-white">GALAXY<span className="text-amber-500">PARTS</span></h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase mt-1">Gestión Técnica Centralizada</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setCurrentView('search')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'search' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Catálogo
                </button>
                <button 
                    onClick={() => setCurrentView('database')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'database' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Base de Datos
                </button>
                </nav>

                {/* SELECTOR DE USUARIO (SIMULADO) */}
                <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-6">
                    <span className="text-xs text-slate-500 uppercase font-bold">Modo:</span>
                    <select 
                        value={currentUser} 
                        onChange={(e) => setCurrentUser(e.target.value)}
                        className="bg-slate-800 text-amber-500 text-xs font-bold py-1 px-2 rounded border border-slate-700 focus:outline-none focus:border-amber-500"
                    >
                        <option value="Admin">Administrador</option>
                        <option value="Técnico">Técnico A</option>
                        <option value="Gerente">Gerencia</option>
                    </select>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ESTADO VACÍO (SIN DATOS) */}
        {db.length === 0 ? (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
                 <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                     <FileSpreadsheet className="w-10 h-10 text-slate-400" />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-900">La Base de Datos está vacía</h2>
                 <p className="text-slate-500 max-w-md">
                    Carga tu inventario usando un archivo Excel (guardado como CSV). 
                    Es la forma más simple de empezar.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 justify-center">
                        <Upload className="w-5 h-5" />
                        Cargar CSV / JSON
                        <input type="file" accept=".csv, .json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadSampleCSV} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2 justify-center">
                        <Download className="w-5 h-5" />
                        Bajar Plantilla Excel (CSV)
                    </button>
                 </div>
             </div>
        ) : (
          <>
            {currentView === 'search' && (
            <>
                {/* HERO SECTION GALAXY */}
                <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden mb-8 border border-slate-800 relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent"></div>
                <div className="px-6 py-8 md:p-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Buscador <span className="text-amber-500">Maestro</span></h2>
                    <p className="text-slate-400 text-sm">Base de datos activa con {db.length} referencias.</p>
                    </div>
                    {/* Buscador de Texto General */}
                    <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-inner"
                        placeholder="Buscar SKU, OEM o Nombre..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    </div>
                </div>

                {/* BARRA DE FILTROS */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                    Filtros de Vehículo
                    </div>
                    <SmartFilters db={db} filters={filters} onFilterChange={handleFilterChange} />
                    
                    {(filters.make || filters.category || filters.search) && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center pt-4 border-t border-slate-200">
                        <span className="text-xs text-slate-400 mr-2">Filtros activos:</span>
                        {filters.make && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            {filters.make} {filters.model && `/ ${filters.model}`}
                            <button onClick={() => handleFilterChange('make', '')} className="ml-1.5 hover:text-amber-900"><X className="w-3 h-3" /></button>
                        </span>
                        )}
                        <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto underline decoration-dotted">
                        Limpiar Todo
                        </button>
                    </div>
                    )}
                </div>
                </div>

                {/* RESULTADOS */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="font-bold text-slate-700 text-lg">
                    Resultados <span className="text-slate-400 font-normal text-sm ml-2">({filteredProducts.length} encontrados)</span>
                </h3>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                    <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                    <Grid className="w-4 h-4" />
                    </button>
                    <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100 text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                    <List className="w-4 h-4" />
                    </button>
                </div>
                </div>

                {filteredProducts.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {filteredProducts.map(product => (
                    <ProductCard key={product.id || product.sku} product={product} onClick={() => handleProductSelect(product)} viewMode={viewMode} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-medium">No se encontraron productos</h3>
                    <p className="text-slate-500 text-sm mt-1">Intenta ajustar tus filtros de búsqueda.</p>
                </div>
                )}
            </>
            )}

            {currentView === 'detail' && selectedProduct && (
            <ProductDetail product={selectedProduct} onBack={() => setCurrentView('search')} onEdit={handleEditClick} historyLog={historyLog} />
            )}

            {currentView === 'database' && (
            <DatabaseView db={db} filters={filters} onFilterChange={handleFilterChange} onEdit={handleEditClick} historyLog={historyLog} />
            )}
          </>
        )}
      </main>

      {/* MODAL DE EDICIÓN GLOBAL */}
      <ProductEditModal 
        product={productToEdit} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleSaveProduct}
        currentUser={currentUser}
      />

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <Database className="w-8 h-8 text-amber-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">GALAXY PARTS SYSTEM</p>
          <p className="text-xs text-slate-500 mt-2">Versión 2.1 | Soporte CSV Universal</p>
        </div>
      </footer>
    </div>
  );
};

export default AutoCatalogApp;
