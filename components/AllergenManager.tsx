import React, { useMemo, useState } from 'react';
import { Recipe } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';

interface AllergenManagerProps {
  recipes: Recipe[];
}

const AllergenManager: React.FC<AllergenManagerProps> = ({ recipes }) => {
  const [selectedAllergen, setSelectedAllergen] = useState<string | null>(null);

  const { allAllergens, recipesWithAllergens } = useMemo(() => {
    const allergenSet = new Set<string>();
    const recipesWithAllergens = recipes.filter(r => r.allergens && r.allergens.allergens.length > 0);
    
    recipesWithAllergens.forEach(r => {
      r.allergens?.allergens.forEach(a => allergenSet.add(a.name));
    });

    return {
      allAllergens: Array.from(allergenSet).sort(),
      recipesWithAllergens
    };
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    if (!selectedAllergen) {
      return [];
    }
    return recipesWithAllergens.filter(r => 
      r.allergens?.allergens.some(a => a.name === selectedAllergen)
    );
  }, [selectedAllergen, recipesWithAllergens]);

  const protocolSteps = [
    {
      icon: 'fa-comments',
      title: '1. Comunicación y Registro',
      description: 'Al recibir a un huésped con alergias (check-in, comanda), registrar de forma clara y visible el alérgeno específico y el nombre del huésped. Comunicar inmediatamente al Chef Ejecutivo y al Maître.',
    },
    {
      icon: 'fa-tasks',
      title: '2. Verificación en Sistema',
      description: 'Utilizar esta herramienta para filtrar las recetas que contienen el alérgeno. Revisar la lista de ingredientes de cualquier plato solicitado para confirmar que no contiene trazas o ingredientes ocultos.',
    },
    {
      icon: 'fa-shield-alt',
      title: '3. Preparación Segura',
      description: 'La partida designada debe limpiar y desinfectar una zona de trabajo exclusiva. Usar utensilios, tablas y sartenes limpios y designados (color púrpura si es posible). Lavarse las manos y cambiar de guantes antes de manipular los alimentos.',
    },
    {
      icon: 'fa-bell-concierge',
      title: '4. Entrega e Identificación',
      description: 'El plato debe ser claramente identificado como "ALERGIA" con un marcador especial. El Maître o el Chef deben supervisar la entrega y confirmar verbalmente con el huésped que es su plato seguro.',
    },
    {
      icon: 'fa-first-aid',
      title: '5. Plan de Emergencia',
      description: 'Todo el personal debe conocer la ubicación del botiquín de primeros auxilios y los números de emergencia. En caso de reacción, notificar al gerente de turno inmediatamente y seguir el protocolo de emergencia del hotel.',
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestión de Alérgenos y Protocolos"
        subtitle="Consulta recetas por alérgenos y sigue los pasos de actuación para garantizar la seguridad del huésped."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Protocol */}
        <div className="lg:col-span-1">
            <div className="bg-white/80 p-6 rounded-xl shadow-md sticky top-8">
                <h3 className="text-xl font-bold text-pf-brown mb-4 pb-2 border-b-2 border-pf-gold">
                    <i className="fas fa-book-medical mr-2 text-pf-green"></i>
                    Protocolo de Actuación
                </h3>
                <div className="space-y-4">
                    {protocolSteps.map(step => (
                        <div key={step.title} className="flex items-start">
                            <i className={`fas ${step.icon} text-2xl text-pf-green w-8 text-center mt-1`}></i>
                            <div className="ml-4">
                                <h4 className="font-bold text-pf-brown">{step.title}</h4>
                                <p className="text-sm text-pf-brown/80">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Right Column: Allergen Tool */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-pf-brown mb-4 pb-2 border-b-2 border-pf-blue">
                <i className="fas fa-search-plus mr-2 text-pf-blue"></i>
                Herramienta de Consulta
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                    <h4 className="font-semibold text-pf-brown mb-2">Alérgenos Identificados</h4>
                    {allAllergens.length > 0 ? (
                    <ul className="space-y-1 max-h-80 overflow-y-auto pr-2">
                        {allAllergens.map(allergen => (
                        <li key={allergen}>
                            <button
                            onClick={() => setSelectedAllergen(allergen)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedAllergen === allergen
                                ? 'bg-pf-green text-white font-semibold shadow'
                                : 'hover:bg-pf-beige'
                            }`}
                            >
                            {allergen}
                            </button>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-xs text-pf-brown/70">
                        No se han analizado alérgenos. Ve al detalle de una receta para empezar.
                    </p>
                    )}
                </div>
                <div className="md:w-2/3">
                     <h4 className="font-semibold text-pf-brown mb-2">
                        {selectedAllergen ? `Recetas que contienen ${selectedAllergen}` : 'Selecciona un alérgeno'}
                    </h4>
                    {selectedAllergen ? (
                        filteredRecipes.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                            {filteredRecipes.map(recipe => (
                                <div key={recipe.id} className="bg-pf-beige/50 p-2 rounded-lg flex items-center space-x-3">
                                <img src={recipe.imageUrl} alt={recipe.name} className="w-16 h-16 object-cover rounded-md" />
                                <h5 className="font-bold text-pf-brown text-sm">{recipe.name}</h5>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 mt-8 h-full flex items-center justify-center">
                                <p className="text-sm">Ninguna receta analizada contiene este alérgeno.</p>
                            </div>
                        )
                        ) : (
                        <div className="text-center text-gray-500 mt-8 h-full flex items-center justify-center">
                            <p className="text-sm">Selecciona un alérgeno para ver las recetas asociadas.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllergenManager;