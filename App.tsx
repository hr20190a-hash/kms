
import React, { useState, useEffect } from 'react';
import { Recipe, InventoryItem, Supplier, ComplianceTask, ComplianceDocument, AllergenInfo, PurchaseOrder, SavedMenu, WeeklyPlan, DayPlan, Ingredient, WasteLogEntry, YieldTest, EventLog } from './types.ts';
import Sidebar, { View } from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import RecipeList from './components/RecipeList.tsx';
import RecipeDetail from './components/RecipeDetail.tsx';
import AIGenerateRecipeModal from './components/AIGenerateRecipeModal.tsx';
import Dashboard from './components/Dashboard.tsx';
import Inventory from './components/Inventory.tsx';
import Suppliers from './components/Suppliers.tsx';
import Costs from './components/Costs.tsx';
import Menu from './components/Menu.tsx';
import Orders from './components/Orders.tsx';
import Compliance from './components/Compliance.tsx';
import AllergenManager from './components/AllergenManager.tsx';
import ManageCategoriesModal from './components/ManageCategoriesModal.tsx';
import ComplianceTaskModal from './components/ComplianceTaskModal.tsx';
import ComplianceDocumentModal from './components/ComplianceDocumentModal.tsx';
import EditOrderModal from './components/EditOrderModal.tsx';
import RecipeEditModal from './components/RecipeEditModal.tsx';
import SavedMenus from './components/SavedMenus.tsx';
import SaveMenuModal from './components/SaveMenuModal.tsx';
import SubstitutionModal from './components/SubstitutionModal.tsx';
import Co2ReductionModal from './components/Co2ReductionModal.tsx';
import WasteLog from './components/WasteLog.tsx';
import ManualOrderModal from './components/ManualOrderModal.tsx';
import YieldTestModal from './components/YieldTestModal.tsx';
import EventLogModal from './components/EventLogModal.tsx';

const App: React.FC = () => {
  // --- Main Data State ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [wasteLogEntries, setWasteLogEntries] = useState<WasteLogEntry[]>([]);
  const [yieldTests, setYieldTests] = useState<YieldTest[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // --- Data Fetching State ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // -----------------------------


  // --- Recipe Edit Modal State ---
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  // -----------------------------

  // --- Compliance Modal State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ComplianceTask | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState<boolean>(false);
  const [selectedTaskForDocuments, setSelectedTaskForDocuments] = useState<ComplianceTask | null>(null);
  const [isEventLogModalOpen, setIsEventLogModalOpen] = useState(false);
  const [editingEventLog, setEditingEventLog] = useState<EventLog | null>(null);
  // -----------------------------

  // --- Order Edit Modal State ---
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  // --- Manual Order Modal State ---
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  // -----------------------------
  
  // --- Menu State ---
  const [activeMenuItems, setActiveMenuItems] = useState<Recipe[]>([]);
  const [isSaveMenuModalOpen, setIsSaveMenuModalOpen] = useState<boolean>(false);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({
    [new Date().toISOString().split('T')[0]]: {
      guests: 45,
      lunch: undefined,
      dinner: undefined,
    }
  });
  // ------------------

  // --- Substitution Modal State ---
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState<{ recipe: Recipe; ingredient: Ingredient } | null>(null);
  // ------------------------------

  // --- CO2 Reduction Modal State ---
  const [isCo2ReductionModalOpen, setIsCo2ReductionModalOpen] = useState(false);
  const [recipeForCo2Suggestions, setRecipeForCo2Suggestions] = useState<Recipe | null>(null);
  // -------------------------------

  // --- Yield Test Modal State ---
  const [isYieldTestModalOpen, setIsYieldTestModalOpen] = useState(false);
  const [editingYieldTest, setEditingYieldTest] = useState<YieldTest | null>(null);
  // ----------------------------
  
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const endpoints = [
                    'get_recipes.php',
                    'get_inventory.php',
                    'get_suppliers.php',
                    'get_compliance_tasks.php',
                    'get_purchase_orders.php',
                    'get_waste_logs.php',
                    'get_yield_tests.php',
                    'get_event_logs.php',
                    'get_saved_menus.php'
                ];

                const responses = await Promise.all(
                    endpoints.map(endpoint => fetch(`api/${endpoint}`))
                );

                const dataPromises = responses.map(async (response) => {
                    if (!response.ok) {
                        throw new Error(`Error del servidor: ${response.status} en ${response.url}`);
                    }
                    const text = await response.text();
                    // If the response is empty, it's likely a silent PHP error. Return an empty array.
                    if (text.trim() === '') {
                        console.warn(`Respuesta vacía desde ${response.url}. Probablemente un error en el script PHP. Se devolverá un array vacío.`);
                        return [];
                    }
                    try {
                        return JSON.parse(text);
                    } catch (parseError) {
                        console.error(`Error al parsear JSON desde ${response.url}. Contenido recibido:`, text);
                        throw new Error(`Respuesta inválida (no es JSON) desde ${response.url}.`);
                    }
                });

                const data = await Promise.all(dataPromises);

                setRecipes(data[0]);
                setInventory(data[1]);
                setSuppliers(data[2]);
                setComplianceTasks(data[3]);
                setPurchaseOrders(data[4]);
                setWasteLogEntries(data[5]);
                setYieldTests(data[6]);
                setEventLogs(data[7]);
                setSavedMenus(data[8]);
                
                // Derive categories from inventory and suppliers
                const invCategories = data[1].map((item: InventoryItem) => item.category);
                const supCategories = data[2].flatMap((sup: Supplier) => sup.categories);
                const allCategories = [...new Set([...invCategories, ...supCategories])].sort();
                setCategories(allCategories);

            } catch (err) {
                let errorMessage = 'No se pudieron cargar los datos. Por favor, verifica el backend y la conexión a la base de datos.';
                 if (err instanceof Error) {
                    errorMessage = `Error de red o servidor: ${err.message}`;
                }
                if (err instanceof Error && (err.message.includes("Respuesta vacía") || err.message.includes("Respuesta inválida"))) {
                    errorMessage += " Esto suele ocurrir por un error en un script PHP (ej. credenciales de base de datos incorrectas en api/config.php) que impide que se genere una respuesta JSON válida.";
                }
                setError(errorMessage);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);


  const handleToggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleBackToList = () => {
    setSelectedRecipe(null);
  };

  const handleViewChange = (view: View) => {
    setSelectedRecipe(null); // Deselect recipe when changing main view
    setSearchTerm(''); // Reset search term when changing view
    setCurrentView(view);
  };
  
  const handleAddNewRecipe = (newRecipe: Recipe) => {
    const recipeWithId = { ...newRecipe, id: `recipe-${Date.now()}` };
    setRecipes(prevRecipes => [recipeWithId, ...prevRecipes]);
    setSelectedRecipe(recipeWithId);
    setCurrentView('Recetas'); // Switch to recipes view to show the new one
    setIsAiModalOpen(false);
  };

  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
    if (selectedRecipe?.id === updatedRecipe.id) {
        setSelectedRecipe(updatedRecipe);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
        // TODO: Implementar llamada a la API para eliminar la receta de la base de datos.
        // Ejemplo: await fetch('./api/delete_recipe.php', { method: 'POST', body: JSON.stringify({ id: recipeId }) });
        
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        if (selectedRecipe?.id === recipeId) {
            setSelectedRecipe(null);
        }
    }
  };

  const handleSaveRecipe = (recipeToSave: Recipe) => {
    const isNew = !recipeToSave.id || !recipes.some(r => r.id === recipeToSave.id);
    if (isNew) {
        const newRecipe = {
            ...recipeToSave,
            id: `recipe-${Date.now()}`,
            imageUrl: recipeToSave.imageUrl || `https://picsum.photos/seed/${recipeToSave.name.split(' ').join('-')}/800/600`,
        };
        setRecipes(prev => [newRecipe, ...prev]);
        setSelectedRecipe(newRecipe);
        setCurrentView('Recetas');
    } else {
        const updatedRecipe = { ...recipeToSave, imageUrl: recipeToSave.imageUrl || `https://picsum.photos/seed/${recipeToSave.name.split(' ').join('-')}/800/600`};
        setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
        if (selectedRecipe?.id === updatedRecipe.id) {
            setSelectedRecipe(updatedRecipe);
        }
    }
    setIsRecipeModalOpen(false);
  };

  // --- Inventory Handlers ---
  const handleAddItem = (newItem: InventoryItem) => {
    setInventory(prev => [newItem, ...prev]);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };
  // -------------------------

  // --- Supplier Handlers ---
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers(prev => [newSupplier, ...prev]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };
  // -------------------------

  // --- Category Handlers ---
  const handleUpdateCategories = (updatedCategories: string[]) => {
    setCategories(updatedCategories);
    setIsCategoriesModalOpen(false);
  };
  // -------------------------

  // --- Compliance Handlers ---
  const handleMarkTaskComplete = (taskId: string) => {
    setComplianceTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'Completado',
              completedBy: 'Chef Ejecutivo',
              completedAt: new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleSaveTask = (taskToSave: ComplianceTask) => {
    const isNew = !complianceTasks.some(t => t.id === taskToSave.id);
    if (isNew) {
      setComplianceTasks(prev => [{ ...taskToSave, id: `ct-${Date.now()}` }, ...prev]);
    } else {
      setComplianceTasks(prev => prev.map(t => t.id === taskToSave.id ? taskToSave : t));
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      setComplianceTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleAddDocument = (taskId: string, documentName: string) => {
    const newDocument: ComplianceDocument = {
      id: `doc-${Date.now()}`,
      name: documentName,
      url: '#', // Placeholder URL
      uploadedAt: new Date().toISOString(),
    };
    setComplianceTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, documents: [...(task.documents || []), newDocument] };
      }
      return task;
    }));
    // Also update the task in the modal
    setSelectedTaskForDocuments(prev => prev ? { ...prev, documents: [...(prev.documents || []), newDocument] } : null);
  };

  const handleDeleteDocument = (taskId: string, documentId: string) => {
    setComplianceTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, documents: (task.documents || []).filter(d => d.id !== documentId) };
      }
      return task;
    }));
     // Also update the task in the modal
     setSelectedTaskForDocuments(prev => prev ? { ...prev, documents: (prev.documents || []).filter(d => d.id !== documentId) } : null);
  };
  
    // --- Event Log Handlers ---
    const handleSaveEventLog = (eventToSave: EventLog) => {
        const isNew = !eventToSave.id || !eventLogs.some(e => e.id === eventToSave.id);
        if (isNew) {
            setEventLogs(prev => [{ ...eventToSave, id: `evt-${Date.now()}` }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            setEventLogs(prev => prev.map(e => e.id === eventToSave.id ? eventToSave : e));
        }
        setIsEventLogModalOpen(false);
    };

    const handleDeleteEventLog = (eventId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            setEventLogs(prev => prev.filter(e => e.id !== eventId));
        }
    };
    // ------------------------

  // --- Orders Handlers ---
  const handleCreateOrder = (newOrder: PurchaseOrder) => {
      setPurchaseOrders(prev => [newOrder, ...prev]);
  };
  
  const handleUpdateOrder = (updatedOrder: PurchaseOrder) => {
      setPurchaseOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setIsEditOrderModalOpen(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'Pendiente' | 'Realizado') => {
    setPurchaseOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      setPurchaseOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };
  // ------------------------

  // --- Menu Handlers ---
  const handleAddRecipeToMenu = (recipe: Recipe) => {
    if (!activeMenuItems.find(r => r.id === recipe.id)) {
      setActiveMenuItems(prev => [...prev, recipe]);
    }
  };

  const handleRemoveRecipeFromMenu = (recipeId: string) => {
    setActiveMenuItems(prev => prev.filter(r => r.id !== recipeId));
  };
  
  const handleClearMenu = () => {
    setActiveMenuItems([]);
  };

  const handleSaveMenu = (name: string, date: string) => {
    const newMenu: SavedMenu = {
      id: `menu-${Date.now()}`,
      name,
      date,
      recipeIds: activeMenuItems.map(r => r.id),
    };
    setSavedMenus(prev => [newMenu, ...prev]);
    setIsSaveMenuModalOpen(false);
  };

  const handleLoadMenu = (menuToLoad: SavedMenu) => {
    const loadedRecipes = menuToLoad.recipeIds.map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
    setActiveMenuItems(loadedRecipes);
    setCurrentView('Menú');
  };

  const handleDeleteMenu = (menuId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este menú guardado?')) {
      setSavedMenus(prev => prev.filter(m => m.id !== menuId));
      // Also remove it from the weekly plan
      setWeeklyPlan(prevPlan => {
        const newPlan = { ...prevPlan };
        Object.keys(newPlan).forEach(date => {
            const dayPlan = newPlan[date];
            if (dayPlan.lunch === menuId || dayPlan.dinner === menuId) {
                newPlan[date] = {
                    ...dayPlan,
                    lunch: dayPlan.lunch === menuId ? undefined : dayPlan.lunch,
                    dinner: dayPlan.dinner === menuId ? undefined : dayPlan.dinner,
                };
            }
        });
        return newPlan;
      });
    }
  };
  
  const handleUpdateWeeklyPlan = (date: string, updates: Partial<DayPlan>) => {
    setWeeklyPlan(prev => {
      const currentDayPlan = prev[date] || { guests: 20, lunch: undefined, dinner: undefined };
      return {
        ...prev,
        [date]: { ...currentDayPlan, ...updates }
      };
    });
  };
  // -------------------------

  // --- Substitution Handlers ---
    const openSubstitutionModal = (recipe: Recipe, ingredient: Ingredient) => {
        setSubstitutionTarget({ recipe, ingredient });
        setIsSubstitutionModalOpen(true);
    };

    const closeSubstitutionModal = () => {
        setIsSubstitutionModalOpen(false);
        setSubstitutionTarget(null);
    };

    const handleSelectSubstitution = (originalIngredientName: string, newIngredient: Ingredient) => {
        if (!substitutionTarget) return;

        const { recipe } = substitutionTarget;
        
        const updatedIngredients = recipe.ingredients.map(ing => 
            ing.name === originalIngredientName ? newIngredient : ing
        );

        const updatedRecipe = { ...recipe, ingredients: updatedIngredients, allergens: undefined }; // Reset allergens after substitution
        
        handleUpdateRecipe(updatedRecipe);
        closeSubstitutionModal();
    };
  // ---------------------------

  // --- Waste Log Handlers ---
  const handleSaveWasteLogEntry = (entry: WasteLogEntry) => {
    const isNew = !entry.id || !wasteLogEntries.some(e => e.id === entry.id);
    if (isNew) {
      const newEntry = { ...entry, id: `waste-${Date.now()}` };
      setWasteLogEntries(prev => [newEntry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      setWasteLogEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    }
  };

  const handleDeleteWasteLogEntry = (entryId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro de desperdicio?')) {
        setWasteLogEntries(prev => prev.filter(e => e.id !== entryId));
    }
  };
  // ---------------------------

  // --- Yield Test Handlers ---
  const handleSaveYieldTest = (test: YieldTest) => {
    const isNew = !test.id || !yieldTests.some(t => t.id === test.id);
    if (isNew) {
      const newTest = { ...test, id: `yt-${Date.now()}` };
      setYieldTests(prev => [newTest, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      setYieldTests(prev => prev.map(t => t.id === test.id ? test : t));
    }
    setIsYieldTestModalOpen(false);
  };

  const handleDeleteYieldTest = (testId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ficha de rendimiento?')) {
        setYieldTests(prev => prev.filter(t => t.id !== testId));
    }
  };
  // ---------------------------


  const openCo2ReductionModal = (recipe: Recipe) => {
    setRecipeForCo2Suggestions(recipe);
    setIsCo2ReductionModalOpen(true);
  };

  const closeCo2ReductionModal = () => {
    setIsCo2ReductionModalOpen(false);
    setRecipeForCo2Suggestions(null);
  };

  const handleRecipeConverted = (convertedRecipe: Recipe) => {
    const newRecipeData: Partial<Recipe> = {
      ...convertedRecipe,
      name: `${selectedRecipe?.name || convertedRecipe.name} (Versión Vegetariana)`,
    };
    setEditingRecipe(newRecipeData as Recipe);
    setIsRecipeModalOpen(true);
  };

  const handleRecipeMadeHealthier = (healthierRecipe: Recipe) => {
    const newRecipeData: Partial<Recipe> = {
      ...healthierRecipe,
      name: `${selectedRecipe?.name || healthierRecipe.name} (Versión Saludable)`,
    };
    setEditingRecipe(newRecipeData as Recipe);
    setIsRecipeModalOpen(true);
  };

  // --- Modal Openers ---
  const openNewRecipeModal = () => {
    setEditingRecipe(null);
    setIsRecipeModalOpen(true);
  };

  const openEditRecipeModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsRecipeModalOpen(true);
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: ComplianceTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const openDocumentModal = (task: ComplianceTask) => {
    setSelectedTaskForDocuments(task);
    setIsDocumentModalOpen(true);
  };
  
  const openEditOrderModal = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsEditOrderModalOpen(true);
  };

  const openNewYieldTestModal = () => {
    setEditingYieldTest(null);
    setIsYieldTestModalOpen(true);
  };
  
  const openEditYieldTestModal = (test: YieldTest) => {
    setEditingYieldTest(test);
    setIsYieldTestModalOpen(true);
  };
  
  const openNewEventLogModal = () => {
    setEditingEventLog(null);
    setIsEventLogModalOpen(true);
  };

  const openEditEventLogModal = (event: EventLog) => {
      setEditingEventLog(event);
      setIsEventLogModalOpen(true);
  };
  // -------------------------

  const renderContent = () => {
    if (currentView === 'Recetas' && selectedRecipe) {
      return <RecipeDetail 
                recipe={selectedRecipe} 
                onBack={handleBackToList} 
                onRecipeUpdate={handleUpdateRecipe} 
                inventory={inventory}
                onEdit={openEditRecipeModal}
                onDelete={handleDeleteRecipe}
                onFindSubstitutions={openSubstitutionModal}
                onRecipeConverted={handleRecipeConverted}
                onHealthierAlternative={handleRecipeMadeHealthier}
                onOpenCo2Suggestions={openCo2ReductionModal}
             />;
    }

    switch (currentView) {
      case 'Dashboard':
        return <Dashboard 
                  weeklyPlan={weeklyPlan}
                  savedMenus={savedMenus}
                  recipes={recipes}
                  inventory={inventory}
                  onViewChange={handleViewChange}
                />;
      case 'Recetas':
        return <RecipeList 
                  recipes={recipes} 
                  onSelectRecipe={handleSelectRecipe} 
                  searchTerm={searchTerm} 
                  onNewRecipe={openNewRecipeModal}
                  onDeleteRecipe={handleDeleteRecipe}
                />;
      case 'Inventario':
        return <Inventory 
                  items={inventory} 
                  suppliers={suppliers}
                  categories={categories}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  recipes={recipes}
                  savedMenus={savedMenus}
                  weeklyPlan={weeklyPlan}
                  purchaseOrders={purchaseOrders}
               />;
      case 'Proveedores':
        return <Suppliers 
                  suppliers={suppliers} 
                  categories={categories}
                  onAddSupplier={handleAddSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onManageCategories={() => setIsCategoriesModalOpen(true)}
                />;
      case 'Costos':
        return <Costs 
                  recipes={recipes} 
                  inventory={inventory} 
                  savedMenus={savedMenus}
                  weeklyPlan={weeklyPlan}
                  suppliers={suppliers}
                  wasteLogEntries={wasteLogEntries}
                  yieldTests={yieldTests}
                  onOpenNewYieldTest={openNewYieldTestModal}
                  onOpenEditYieldTest={openEditYieldTestModal}
                  onDeleteYieldTest={handleDeleteYieldTest}
                />;
      case 'Control de Desperdicios':
        return <WasteLog
                    wasteLogs={wasteLogEntries}
                    recipes={recipes}
                    inventory={inventory}
                    onSave={handleSaveWasteLogEntry}
                    onDelete={handleDeleteWasteLogEntry}
                />;
      case 'Menú':
        return <Menu 
                  recipes={recipes} 
                  inventory={inventory} 
                  menuItems={activeMenuItems}
                  onAddRecipe={handleAddRecipeToMenu}
                  onRemoveRecipe={handleRemoveRecipeFromMenu}
                  onClearMenu={handleClearMenu}
                  onSaveMenu={() => setIsSaveMenuModalOpen(true)}
                />;
      case 'Menús Guardados':
        return <SavedMenus 
                  savedMenus={savedMenus}
                  recipes={recipes}
                  weeklyPlan={weeklyPlan}
                  onLoadMenu={handleLoadMenu}
                  onDeleteMenu={handleDeleteMenu}
                  onUpdateWeeklyPlan={handleUpdateWeeklyPlan}
                />;
      case 'Pedidos':
        return <Orders 
                    inventory={inventory} 
                    suppliers={suppliers}
                    purchaseOrders={purchaseOrders}
                    onCreateOrder={handleCreateOrder}
                    onEditOrder={openEditOrderModal}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                    onOpenManualOrderModal={() => setIsManualOrderModalOpen(true)}
                />;
      case 'APPCC':
        return <Compliance 
                  tasks={complianceTasks} 
                  onMarkComplete={handleMarkTaskComplete}
                  onEdit={openEditTaskModal}
                  onDelete={handleDeleteTask}
                  onManageDocuments={openDocumentModal}
                  onNewTask={openNewTaskModal}
                  eventLogs={eventLogs}
                  onNewEvent={openNewEventLogModal}
                  onEditEvent={openEditEventLogModal}
                  onDeleteEvent={handleDeleteEventLog}
                />;
      case 'Alérgenos':
        return <AllergenManager recipes={recipes} />;
      default:
        return <h1>Not Found</h1>;
    }
  };

  return (
    <div className="flex h-screen bg-pf-beige text-pf-brown">
      {isSidebarVisible && (
        <Sidebar 
          onGenerateRecipeClick={() => setIsAiModalOpen(true)} 
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-pf-beige/50 p-8">
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <i className="fas fa-spinner fa-spin fa-3x text-pf-brown/50"></i>
                    <p className="mt-4 text-pf-brown/80 font-semibold">Cargando datos del sistema...</p>
                </div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-600 bg-red-100/50 p-8 rounded-lg">
                    <i className="fas fa-exclamation-triangle fa-3x mb-4"></i>
                    <h3 className="text-xl font-bold">Error al Cargar</h3>
                    <p className="mt-2">{error}</p>
                </div>
            )}
            {!isLoading && !error && renderContent()}
        </main>
      </div>
      <AIGenerateRecipeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onRecipeGenerated={handleAddNewRecipe}
      />
      <ManageCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        currentCategories={categories}
        onSave={handleUpdateCategories}
      />
      {isRecipeModalOpen && (
        <RecipeEditModal
          isOpen={isRecipeModalOpen}
          onClose={() => setIsRecipeModalOpen(false)}
          onSave={handleSaveRecipe}
          recipe={editingRecipe}
          inventory={inventory}
        />
      )}
      {isTaskModalOpen && (
        <ComplianceTaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSave={handleSaveTask}
            task={editingTask}
        />
      )}
      {isDocumentModalOpen && selectedTaskForDocuments && (
        <ComplianceDocumentModal
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          task={selectedTaskForDocuments}
          onAddDocument={handleAddDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      )}
       {isEventLogModalOpen && (
        <EventLogModal
            isOpen={isEventLogModalOpen}
            onClose={() => setIsEventLogModalOpen(false)}
            onSave={handleSaveEventLog}
            eventLog={editingEventLog}
        />
      )}
      {isEditOrderModalOpen && editingOrder && (
        <EditOrderModal
            isOpen={isEditOrderModalOpen}
            onClose={() => setIsEditOrderModalOpen(false)}
            onSave={handleUpdateOrder}
            order={editingOrder}
            suppliers={suppliers}
        />
      )}
      <ManualOrderModal
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        onCreateOrder={handleCreateOrder}
        inventory={inventory}
        suppliers={suppliers}
      />
      <SaveMenuModal
        isOpen={isSaveMenuModalOpen}
        onClose={() => setIsSaveMenuModalOpen(false)}
        onSave={handleSaveMenu}
      />
      {isSubstitutionModalOpen && substitutionTarget && (
        <SubstitutionModal
            isOpen={isSubstitutionModalOpen}
            onClose={closeSubstitutionModal}
            onSave={handleSelectSubstitution}
            recipe={substitutionTarget.recipe}
            ingredient={substitutionTarget.ingredient}
        />
      )}
      {isCo2ReductionModalOpen && recipeForCo2Suggestions && (
        <Co2ReductionModal
            isOpen={isCo2ReductionModalOpen}
            onClose={closeCo2ReductionModal}
            recipe={recipeForCo2Suggestions}
        />
      )}
      {isYieldTestModalOpen && (
        <YieldTestModal
          isOpen={isYieldTestModalOpen}
          onClose={() => setIsYieldTestModalOpen(false)}
          onSave={handleSaveYieldTest}
          test={editingYieldTest}
          inventory={inventory}
          suppliers={suppliers}
        />
      )}
    </div>
  );
};

export default App;
