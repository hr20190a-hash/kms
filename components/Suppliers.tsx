import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Supplier } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';

interface SuppliersProps {
  suppliers: Supplier[];
  categories: string[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onManageCategories: () => void;
}

const EditableRow: React.FC<{ supplier: Supplier; allCategories: string[]; onSave: (supplier: Supplier) => void; onCancel: () => void; }> = ({ supplier, allCategories, onSave, onCancel }) => {
    const [edited, setEdited] = useState(supplier);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputStyles = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsCategoryDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEdited(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCategoryToggle = (category: string) => {
      setEdited(prev => {
        const newCategories = prev.categories.includes(category)
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category];
        return { ...prev, categories: newCategories.sort() };
      });
    };

    return (
        <tr className="bg-pf-gold/20">
            <td className="px-6 py-4"><input name="name" value={edited.name} onChange={handleChange} className={inputStyles} placeholder="Nombre" /></td>
            <td className="px-6 py-4"><input name="contactPerson" value={edited.contactPerson} onChange={handleChange} className={inputStyles} placeholder="Contacto" /></td>
            <td className="px-6 py-4"><input name="phone" value={edited.phone} onChange={handleChange} className={inputStyles} placeholder="Teléfono" /></td>
            <td className="px-6 py-4"><input name="email" type="email" value={edited.email} onChange={handleChange} className={inputStyles} placeholder="Email" /></td>
            <td className="px-6 py-4" style={{ minWidth: '200px' }}>
              <div className="relative" ref={dropdownRef}>
                  <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                      className="w-full text-left p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green flex justify-between items-center"
                  >
                      <span className="truncate pr-1">{edited.categories.length > 0 ? `${edited.categories.length} seleccionada(s)` : 'Seleccionar...'}</span>
                      <i className={`fas fa-chevron-down transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  {isCategoryDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {allCategories.map(cat => (
                              <label key={cat} className="flex items-center px-3 py-2 text-sm hover:bg-pf-beige/50 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={edited.categories.includes(cat)}
                                      onChange={() => handleCategoryToggle(cat)}
                                      className="h-4 w-4 rounded border-gray-300 text-pf-green focus:ring-pf-green"
                                  />
                                  <span className="ml-3 text-pf-brown">{cat}</span>
                              </label>
                          ))}
                      </div>
                  )}
              </div>
            </td>
            <td className="px-6 py-4 flex space-x-2">
                <button onClick={() => onSave(edited)} className="text-green-600 hover:text-green-900"><i className="fas fa-check fa-lg"></i></button>
                <button onClick={onCancel} className="text-red-600 hover:text-red-900"><i className="fas fa-times fa-lg"></i></button>
            </td>
        </tr>
    );
};


const Suppliers: React.FC<SuppliersProps> = ({ suppliers, categories, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onManageCategories }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(supplier => {
            const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || supplier.categories.includes(filterCategory);
            return matchesSearch && matchesCategory;
        });
    }, [suppliers, searchTerm, filterCategory]);

    const handleSave = (supplier: Supplier) => {
        if (supplier.id.startsWith('sup-new-') && !supplier.name) {
            onDeleteSupplier(supplier.id);
        } else {
            onUpdateSupplier(supplier);
        }
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres borrar este proveedor?')) {
            onDeleteSupplier(id);
        }
    };
    
    const handleCancel = (supplier: Supplier) => {
      if (supplier.id.startsWith('sup-new-')) {
          onDeleteSupplier(supplier.id);
      }
      setEditingId(null);
    };

    const handleAddNew = () => {
        const newId = `sup-new-${Date.now()}`;
        const newSupplier: Supplier = { id: newId, name: '', contactPerson: '', phone: '', email: '', address: '', categories: [] };
        onAddSupplier(newSupplier);
        setEditingId(newId);
    };

    const handleExport = () => {
        const headers = "id,name,contactPerson,phone,email,address,categories";
        const csvContent = [
            headers,
            ...filteredSuppliers.map(s => 
                [s.id, `"${s.name}"`, `"${s.contactPerson}"`, s.phone, s.email, `"${s.address}"`, `"${s.categories.join('|')}"`].join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "proveedores.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Gestión de Proveedores"
                subtitle="Directorio centralizado y editable de todos los proveedores."
            />
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4 items-center">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o contacto..." 
                        className="w-full max-w-xs pl-4 pr-4 py-2 bg-white border border-pf-brown/20 rounded-lg text-pf-brown placeholder-pf-brown/60 focus:outline-none focus:ring-2 focus:ring-pf-green"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                        <select 
                            className="pl-4 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pf-green bg-white"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                         <Button variant="secondary" onClick={onManageCategories} className="py-2 px-3">
                            <i className="fas fa-cog mr-2"></i><span>Gestionar</span>
                        </Button>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={handleExport}><i className="fas fa-file-export mr-2"></i>Exportar</Button>
                    <Button onClick={handleAddNew} disabled={editingId !== null}><i className="fas fa-plus mr-2"></i>Añadir Proveedor</Button>
                </div>
            </div>
            
            <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-pf-brown uppercase bg-pf-beige/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre Proveedor</th>
                                <th scope="col" className="px-6 py-3">Contacto</th>
                                <th scope="col" className="px-6 py-3">Teléfono</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Categorías</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map(supplier => (
                                editingId === supplier.id
                                ? <EditableRow key={supplier.id} supplier={supplier} allCategories={categories} onSave={handleSave} onCancel={() => handleCancel(supplier)} />
                                : (
                                    <tr key={supplier.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                                        <td className="px-6 py-4 font-medium text-pf-brown">{supplier.name}</td>
                                        <td className="px-6 py-4">{supplier.contactPerson}</td>
                                        <td className="px-6 py-4">{supplier.phone}</td>
                                        <td className="px-6 py-4">{supplier.email}</td>
                                        <td className="px-6 py-4">
                                          <div className="flex flex-wrap gap-1 max-w-xs">
                                            {supplier.categories.map((cat, index) => (
                                              <span key={index} className="px-2 py-0.5 text-xs font-medium rounded-full bg-pf-blue/30 text-pf-brown">
                                                {cat}
                                              </span>
                                            ))}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 flex items-center space-x-4">
                                            <button onClick={() => setEditingId(supplier.id)} className="font-medium text-pf-green hover:text-pf-brown" disabled={editingId !== null}><i className="fas fa-pencil-alt"></i></button>
                                            <button onClick={() => handleDelete(supplier.id)} className="font-medium text-red-600 hover:text-red-900" disabled={editingId !== null}><i className="fas fa-trash-alt"></i></button>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Suppliers;