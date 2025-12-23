# 🏛️ Schéma de Gestion de la Mairie

Ce document détaille l'organisation structurelle d'une mairie type et les interrelations entre ses différents services et les usagers.

## 🏛️ Structure du Personnel (Staff)

Chaque mairie est dotée d'une équipe de 10 membres répartis selon une hiérarchie fonctionnelle :

1.  **Exécutif** :
    *   **Maire** : Autorité suprême, signature des actes officiels et décisions politiques.
    *   **Maire Adjoint** : Seconde le maire et assure les délégations de fonctions.
2.  **Administration Centrale** :
    *   **Secrétaire Général** : Pivot de l'administration, coordonne tous les services et assure la conformité juridique.
3.  **Services Techniques & Opérationnels** :
    *   **Service État Civil** :
        *   **Chef Service État Civil** : Supervise les actes de naissance, mariage, décès.
        *   **Officier État Civil (x2)** : Accueil et instruction des dossiers d'état civil.
    *   **Service Urbanisme** :
        *   **Chef Service Urbanisme** : Gestion du plan local d'urbanisme (PLU) et instruction des permis.
        *   **Agent Municipal** : Travail de terrain, constatations et soutien technique.
4.  **Front Office & Support** :
    *   **Agent d'Accueil** : Premier point de contact, orientation et information.
    *   **Stagiaire** : Soutien administratif et apprentissage des métiers municipaux.

## 👥 Gestion des Usagers

Il existe un compte unique de type **Usager** pour toute personne externe en interaction avec la mairie. Les distinctions suivantes sont gérées par des **statuts internes** :

*   **Usager Résident** : Habitant de la commune (préférentiel pour certains services).
*   **Usager Non-résident** : Habitant d'une autre commune.
*   **Usager Étranger** : Ressortissant étranger nécessitant des démarches spécifiques.

## 📊 Diagramme Interrelationnel

```mermaid
graph TD
    subgraph Staff ["🏛️ Personnel de la Mairie"]
        Maire["Maire (Signature/Validation)"]
        MA["Maire Adjoint"]
        SG["Secrétaire Général (Coordination)"]
        
        subgraph TechServices ["Services Techniques"]
            CEC["Chef Service État Civil"]
            CU["Chef Service Urbanisme"]
            OEC1["Officier État Civil 1"]
            OEC2["Officier État Civil 2"]
            AM["Agent Municipal (Terrain)"]
        end
        
        subgraph Reception ["Accueil"]
            AA["Agent d'Accueil"]
            S["Stagiaire"]
        end
    end

    subgraph Users ["👥 Usagers"]
        U["Compte Usager Unique"]
        UR["Statut: Résident"]
        UNR["Statut: Non-résident"]
        UE["Statut: Étranger"]
        
        U -.-> UR
        U -.-> UNR
        U -.-> UE
    end

    %% Hiérarchie Staff
    Maire --- MA
    Maire --- SG
    SG --- CEC
    SG --- CU
    CEC --- OEC1
    CEC --- OEC2
    CU --- AM
    AA --- S

    %% Interrelations Usagers <-> Mairie
    U <==> AA : "1. Accueil & Orientation"
    AA <==> SG : "Coordination administrative"
    
    U <==> OEC1 & OEC2 : "2. Démarches État Civil"
    OEC1 & OEC2 <--> CEC : "Instruction dossiers"
    CEC <--> Maire & MA : "Signature Actes"

    U <==> AM : "3. Urbanisme & Services Techniques"
    AM <--> CU : "Expertise technique"
    CU <--> Maire & MA : "Validation Permis/Plans"
    
    S -.-> AA : "Assistance"
```

## 🔄 Flux de Travail Types

1.  **Demande d'acte d'état civil** : Usager -> Agent d'Accueil -> Officier État Civil -> Chef Service -> Maire (Signature).
2.  **Demande de permis de construire** : Usager -> Service Urbanisme -> Agent Municipal (visite terrain) -> Chef Service Urbanisme -> Secrétaire Général -> Maire.
3.  **Réception simple** : Usager -> Agent d'Accueil -> Orientation vers le service compétent.
