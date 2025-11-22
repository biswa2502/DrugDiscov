  let selectedPlant = null;
        let currentCompounds = [];
        let filteredCompounds = [];
        let screeningChart = null;
        let currentPage = 1;
let searchResults = [];
let rowsPerPage = 10;
let currentPreset = 'moderate';
        // Navigation state management
let workflowState = {
    startDiscoveryClicked: false,
    plantSelected: false,
    dataExplored: false,
    screeningApplied: false
};

        // Search index for fast searching
        let searchIndex = [];

        // Filter presets
        const filterPresets = {
    permissive: {
        bbb: 'no',
        hepato: false,
        carcino: false,
        immuno: false,
        mutagen: false,
        cyto: false
    },
    moderate: {
        bbb: 'no',
        hepato: true,
        carcino: true,
        immuno: true,
        mutagen: true,
        cyto: true
    },
    strict: {
        bbb: 'no',
        hepato: true,
        carcino: true,
        immuno: true,
        mutagen: true,
        cyto: true
    }
};

        // Initialize
        window.onload = function() {
            initPlantGrid();
            buildSearchIndex();
            
            // Reset workflow state on page load
            workflowState = {
                startDiscoveryClicked: false,
                plantSelected: false,
                dataExplored: false,
                screeningApplied: false
            };
        };
        // Hash-based routing - ADD THIS NEW SECTION
const sectionMap = {
    'home': 'home-section',
    'select': 'select-section',
    'explore': 'explore-section',
    'screen': 'screen-section',
    'results': 'results-section',
    'guide': 'guide-section',
    'about': 'about-section'
};

function navigateToSection(sectionName) {
    window.location.hash = sectionName;
}

function handleHashChange() {
    let hash = window.location.hash.slice(1);
    if (!hash || !sectionMap[hash]) {
        hash = 'home';
        window.location.hash = 'home';
    }
    showSectionByHash(hash);
}

function showSectionByHash(hash) {
    const sectionId = sectionMap[hash];
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-section') === hash) {
            tab.classList.add('active');
        }
    });
    
    window.scrollTo(0, 0);
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Add click listeners to nav tabs
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const section = this.getAttribute('data-section');
        navigateToSection(section);
    });
});

// Handle initial load
handleHashChange();

        // Build search index
        function buildSearchIndex() {
            searchIndex = [];
            for (let plantKey in plantDatabase) {
                const plant = plantDatabase[plantKey];
                if (plant.compounds) {
                    plant.compounds.forEach((compound, idx) => {
                        searchIndex.push({
                            plantKey: plantKey,
                            compoundIndex: idx,
                            searchText: `${compound.name} ${compound.cid} ${compound.formula} ${compound.smiles}`.toLowerCase()
                        });
                    });
                }
            }
        }
        // Start discovery workflow
        function startDiscovery() {
            workflowState.startDiscoveryClicked = true;
            navigateToSection('select');
            }

        // Proceed to screening workflow
        function proceedToScreening() {
            workflowState.dataExplored = true;
            navigateToSection('screen');
        }


        // Initialize plant grid
        function initPlantGrid() {
            const grid = document.getElementById('plantGrid');
            grid.innerHTML = plants.map(plant => {
                // *** MODIFICATION: Count compounds from the (now guaranteed) DB entry ***
                const compoundCount = plantDatabase[plant.id]?.compounds?.length || 0;
                return `
                    <div class="plant-card" onclick="selectPlant('${plant.id}', event)" data-plant-name="${plant.name.toLowerCase()}" data-common-name="${plant.common.toLowerCase()}">
                        <div class="plant-name">${plant.common || plant.name}</div>
                        <div class="plant-scientific">${plant.name}</div>
                        <div class="plant-compound-count">${compoundCount} compounds</div>
                    </div>
                `;
            }).join('');
        }

        // Filter plants in selection
        function filterPlants() {
            const searchTerm = document.getElementById('plantSearch').value.toLowerCase();
            const cards = document.querySelectorAll('.plant-card');
            
            cards.forEach(card => {
                const plantName = card.getAttribute('data-plant-name');
                const commonName = card.getAttribute('data-common-name');
                
                if (plantName.includes(searchTerm) || commonName.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Select plant with loading animation
        function selectPlant(plantId, event) {
            selectedPlant = plantId;
            currentPage = 1;
            
            document.querySelectorAll('.plant-card').forEach(card => card.classList.remove('selected'));
            if(event) {
                const cardElement = event.currentTarget;
                if(cardElement) cardElement.classList.add('selected');
            }

            const loadingScreen = document.getElementById('loadingScreen');
            const plantGrid = document.getElementById('plantGrid');
            
            loadingScreen.classList.add('active');
            plantGrid.style.display = 'none';
            
            // Simulate loading with progress bar
            let progress = 0;
            const progressBar = document.getElementById('loadingProgress');
            const interval = setInterval(() => {
                progress += 10;
                progressBar.style.width = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => loadPlantData(plantId), 300);
                }
            }, 150);
        }

        // Load plant data
        function loadPlantData(plantId) {
            const plantInfo = plants.find(p => p.id === plantId);
            const plantData = plantDatabase[plantId];
            
            if (plantData && plantData.compounds && plantData.compounds.length > 0) {
                currentCompounds = plantData.compounds;
                searchResults = [...currentCompounds];
            } else {
                // Fallback for any potential mismatch
                currentCompounds = [];
                searchResults = [];
            }
            
            document.getElementById('explorePlantName').textContent = `${plantInfo.name} (${plantInfo.common || 'N/A'})`;
            document.getElementById('selectedPlantName').textContent = `${plantInfo.name} (${plantInfo.common || 'N/A'})`;
            document.getElementById('exploreTotalCompounds').textContent = currentCompounds.length;
            document.getElementById('exploreSearchResults').textContent = searchResults.length;

            document.getElementById('loadingScreen').classList.remove('active');
            document.getElementById('plantGrid').style.display = 'grid';
            document.getElementById('loadingProgress').style.width = '0%';

            // Apply moderate preset by default
            applyPreset('moderate');
            
            displayExploreTable();
                        //document.getElementById('exploreTab').style.display = 'block';
            
            // Mark plant as selected
            workflowState.plantSelected = true;
            
            navigateToSection('explore');
        }

        // Search compounds
        function searchCompounds() {
            const searchTerm = document.getElementById('compoundSearch').value.toLowerCase();
            
            if (searchTerm === '') {
                searchResults = [...currentCompounds];
            } else {
                searchResults = currentCompounds.filter(compound => {
                    const searchText = `${compound.name} ${compound.cid} ${compound.formula} ${compound.smiles}`.toLowerCase();
                    return searchText.includes(searchTerm);
                });
            }
            
            currentPage = 1;
            document.getElementById('exploreSearchResults').textContent = searchResults.length;
            displayExploreTable();
        }

        // Display explore table with virtual scrolling support
        function displayExploreTable() {
            const container = document.getElementById('exploreTableContainer');
            const paginationControls = document.getElementById('paginationControls');

            if (searchResults.length === 0) {
                container.innerHTML = `<p style="text-align: center; padding: 30px; color: var(--text-gray);">No compounds found. Try adjusting your search or filters.</p>`;
                paginationControls.style.display = 'none';
                return;
            }

            paginationControls.style.display = 'flex';
            
            const totalPages = Math.ceil(searchResults.length / rowsPerPage);
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const pageCompounds = searchResults.slice(startIndex, endIndex);

            const tableHTML = `
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>CID</th>
                            <th>Formula</th>
                            <th>Weight</th>
                            <th>SMILES</th> <!-- ADDED SMILES HEADER -->
                            <th>Bioavailability</th>
                            <th>BBB</th>
                            <th>Lipinski</th>
                            <th>Drug Likeness</th>
                            <!-- <th>Toxicity Status</th> REMOVED -->
                            <!-- ADDED 4 NEW HEADERS -->
                            <th>QED</th>
                            <th>logP</th>
                            <th>HBA</th>
                            <th>HBD</th>
                            <!-- ADDED 5 NEW TOXICITY HEADERS -->
                            <th>Hepatotoxicity</th>
                            <th>Carcinogenicity</th>
                            <th>Immunogenicity</th>
                            <th>Mutagenicity</th>
                            <th>Cytotoxicity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageCompounds.map(c => {
                            // Removed old toxicity logic
                            
                            return `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.cid}</td>
                                <td>${c.formula}</td>
                                <td>${c.weight}</td>
                                <td>${c.smiles}</td> <!-- ADDED SMILES DATA -->
                                <td>${c.bioavailability.toFixed(2)}</td>
                                <td>${c.bbb}</td>
                                <!-- UPDATED Lipinski badge logic -->
<td><span class="badge ${c.lipinski === 0 || c.lipinski === '0' ? 'active' : 'inactive'}">${c.lipinski === 0 || c.lipinski === '0' ? 'Pass (0)' : 'Fail (' + c.lipinski + ')'}</span></td>                                <td>${c.drugLikeness.toFixed(2)}</td>
                                <!-- REMOVED old toxicity status cell -->
                                
                                <!-- ADDED 4 NEW CELLS -->
                                <td>${c.qed?.toFixed(2) || 'N/A'}</td>
                                <td>${c.logP?.toFixed(2) || 'N/A'}</td>
                                <td>${c.hba || 'N/A'}</td>
                                <td>${c.hbd || 'N/A'}</td>
                                
                                <!-- ADDED 5 NEW TOXICITY CELLS WITH BADGES -->
                                <td><span class="badge ${c.hepatotoxicity === 'Inactive' ? 'active' : 'inactive'}">${c.hepatotoxicity}</span></td>
                                <td><span class="badge ${c.carcinogenicity === 'Inactive' ? 'active' : 'inactive'}">${c.carcinogenicity}</span></td>
                                <td><span class="badge ${c.immunogenicity === 'Inactive' ? 'active' : 'inactive'}">${c.immunogenicity}</span></td>
                                <td><span class="badge ${c.mutagenicity === 'Inactive' ? 'active' : 'inactive'}">${c.mutagenicity}</span></td>
                                <td><span class="badge ${c.cytotoxicity === 'Inactive' ? 'active' : 'inactive'}">${c.cytotoxicity}</span></td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            `;
            container.innerHTML = tableHTML;
            updatePaginationControls();
        }

        function updatePaginationControls() {
            const totalPages = Math.ceil(searchResults.length / rowsPerPage);
            const startIndex = (currentPage - 1) * rowsPerPage + 1;
            const endIndex = Math.min(currentPage * rowsPerPage, searchResults.length);
            
            document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('rowRangeInfo').textContent = `Showing ${startIndex}-${endIndex} of ${searchResults.length} compounds`;
            
            document.getElementById('prevPageBtn').disabled = currentPage === 1;
            document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalPages === 0;
        }

        function prevPage() {
            if (currentPage > 1) {
                currentPage--;
                displayExploreTable();
            }
        }

        function nextPage() {
            const totalPages = Math.ceil(searchResults.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayExploreTable();
            }
        }
        // Change rows per page
        function changeRowsPerPage() {
            const selector = document.getElementById('rowsPerPageSelect');
            rowsPerPage = parseInt(selector.value);
            currentPage = 1; // Reset to first page
            displayExploreTable();
        }

        // Apply filter preset
        function applyPreset(presetName) {
            currentPreset = presetName;
            
            // Update active button
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            event?.target?.classList.add('active');
            
            if (presetName === 'custom') return;
            
            const preset = filterPresets[presetName];

// BBB filter only (bio and drug are now fixed)
document.querySelector(`input[name="bbb"][value="${preset.bbb}"]`).checked = true;

// Optional filters (all OFF for presets)
if (document.getElementById('mwSwitch')) document.getElementById('mwSwitch').checked = false;
if (document.getElementById('qedSwitch')) document.getElementById('qedSwitch').checked = false;
if (document.getElementById('logPSwitch')) document.getElementById('logPSwitch').checked = false;
if (document.getElementById('hbdSwitch')) document.getElementById('hbdSwitch').checked = false;
if (document.getElementById('hbaSwitch')) document.getElementById('hbaSwitch').checked = false;

// Toxicity filters
document.getElementById('hepatoSwitch').checked = preset.hepato;
document.getElementById('carcinoSwitch').checked = preset.carcino;
document.getElementById('immunoSwitch').checked = preset.immuno;
document.getElementById('mutagenSwitch').checked = preset.mutagen;
document.getElementById('cytoSwitch').checked = preset.cyto;

updateFilters();
        }

        // Update filters with STRICT SEQUENTIAL filtering
function updateFilters() {
    if (!currentCompounds || currentCompounds.length === 0) return;
     
    // Get filter states
    const bbbFilter = document.querySelector('input[name="bbb"]:checked').value;
    
    // Optional filters (OFF by default)
    const mwEnabled = document.getElementById('mwSwitch')?.checked || false;
    const qedEnabled = document.getElementById('qedSwitch')?.checked || false;
    const logPEnabled = document.getElementById('logPSwitch')?.checked || false;
    const hbdEnabled = document.getElementById('hbdSwitch')?.checked || false;
    const hbaEnabled = document.getElementById('hbaSwitch')?.checked || false;
    
    // Toxicity filters (always active)
    const noHepato = document.getElementById('hepatoSwitch').checked;
    const noCarcino = document.getElementById('carcinoSwitch').checked;
    const noImmuno = document.getElementById('immunoSwitch').checked;
    const noMutagen = document.getElementById('mutagenSwitch').checked;
    const noCyto = document.getElementById('cytoSwitch').checked;

    // STRICT SEQUENTIAL FILTERING
    let compounds = [...currentCompounds];
    let stageResults = {};
    
    // Stage 0: Total
    stageResults.total = compounds.length;
    
    // Stage 1: Bioavailability ≥ 0.55 (FIXED)
    compounds = compounds.filter(c => c.bioavailability >= 0.55);
    stageResults.afterBio = compounds.length;
    
    // Stage 2: BBB Permeability
    if (bbbFilter === 'yes') {
        compounds = compounds.filter(c => c.bbb === 'Yes');
    } else if (bbbFilter === 'no') {
        compounds = compounds.filter(c => c.bbb === 'No');
    }
    stageResults.afterBBB = compounds.length;
    
    // Stage 3: Lipinski violations = 0 (ONLY)
    compounds = compounds.filter(c => {
        const lipinski = c.lipinski;
        // Check if it's numeric 0 or string "0"
        return lipinski === 0 || lipinski === '0';
    });
    stageResults.afterLipinski = compounds.length;
    
    // Stage 4: Drug Likeness ≥ 3.5 (FIXED)
    compounds = compounds.filter(c => c.drugLikeness >= 3.5);
    stageResults.afterDrugLikeness = compounds.length;
    
    // Stage 5: Optional Filters (only if enabled)
    let optionalFiltersApplied = false;
    
    if (mwEnabled) {
        compounds = compounds.filter(c => {
            const weight = parseFloat(c.weight);
            return weight >= 150 && weight <= 500;
        });
        optionalFiltersApplied = true;
    }
    
    if (qedEnabled) {
        compounds = compounds.filter(c => {
            const qed = c.qed === 'N/A' || c.qed === null ? 0 : parseFloat(c.qed);
            return qed >= 0.60;
        });
        optionalFiltersApplied = true;
    }
    
    if (logPEnabled) {
        compounds = compounds.filter(c => {
            const logP = c.logP === 'N/A' || c.logP === null ? 0 : parseFloat(c.logP);
            return logP >= 1 && logP <= 3;
        });
        optionalFiltersApplied = true;
    }
    
    if (hbdEnabled) {
        compounds = compounds.filter(c => {
            const hbd = c.hbd === 'N/A' || c.hbd === null ? 0 : parseInt(c.hbd);
            return hbd <= 5;
        });
        optionalFiltersApplied = true;
    }
    
    if (hbaEnabled) {
        compounds = compounds.filter(c => {
            const hba = c.hba === 'N/A' || c.hba === null ? 0 : parseInt(c.hba);
            return hba <= 10;
        });
        optionalFiltersApplied = true;
    }
    
    stageResults.afterOptional = optionalFiltersApplied ? compounds.length : null;
    
    // Stage 6: Toxicity (ALL must be Inactive)
    compounds = compounds.filter(c => {
        if (noHepato && c.hepatotoxicity === 'Active') return false;
        if (noCarcino && c.carcinogenicity === 'Active') return false;
        if (noImmuno && c.immunogenicity === 'Active') return false;
        if (noMutagen && c.mutagenicity === 'Active') return false;
        if (noCyto && c.cytotoxicity === 'Active') return false;
        return true;
    });
    stageResults.afterToxicity = compounds.length;

    // Update global filtered compounds
    filteredCompounds = compounds;

    // Update UI stats
    document.getElementById('totalCompounds').textContent = currentCompounds.length;
    document.getElementById('filteredCompounds').textContent = filteredCompounds.length;
    const rate = currentCompounds.length > 0 ? 
        ((filteredCompounds.length / currentCompounds.length) * 100).toFixed(1) : 0;
    document.getElementById('successRate').textContent = rate + '%';

    // Update chart with stage results
    updateChart(stageResults);
}
// Update screening chart with SEQUENTIAL STAGES
function updateChart(stageResults) {
    const canvas = document.getElementById('screeningChart');
    const ctx = canvas.getContext('2d');
    
    if (screeningChart) {
        screeningChart.destroy();
    }

    // 1. Create "3D" Gradients
    // Blue Gradient (Standard bars)
    const gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(14, 165, 233, 1)');   // Deep Blue Top
    gradientBlue.addColorStop(0.6, 'rgba(56, 189, 248, 0.8)'); // Lighter Middle
    gradientBlue.addColorStop(1, 'rgba(56, 189, 248, 0.1)');   // Faded Bottom

    // Green Gradient (Final Success bar)
    const gradientGreen = ctx.createLinearGradient(0, 0, 0, 400);
    gradientGreen.addColorStop(0, 'rgba(22, 163, 74, 1)');
    gradientGreen.addColorStop(0.6, 'rgba(74, 222, 128, 0.8)');
    gradientGreen.addColorStop(1, 'rgba(74, 222, 128, 0.1)');

    const chartLabels = [];
    const chartData = [];

    // Prepare Data (Same logic as before)
    chartLabels.push('Total');
    chartData.push(stageResults.total);

    chartLabels.push('Bioavail.');
    chartData.push(stageResults.afterBio);

    chartLabels.push('BBB');
    chartData.push(stageResults.afterBBB);

    chartLabels.push('Lipinski');
    chartData.push(stageResults.afterLipinski);

    chartLabels.push('Drug-Like');
    chartData.push(stageResults.afterDrugLikeness);

    if (stageResults.afterOptional !== null) {
        chartLabels.push('Optional');
        chartData.push(stageResults.afterOptional);
    }

    chartLabels.push('Final');
    chartData.push(stageResults.afterToxicity);

    // 2. Render Modern Chart
    screeningChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Compounds Remaining',
                data: chartData,
                backgroundColor: function(context) {
                    // Logic: If it's the last bar, make it Green (Success)
                    const index = context.dataIndex;
                    const count = context.chart.data.labels.length;
                    return index === count - 1 ? gradientGreen : gradientBlue;
                },
                borderRadius: 15, // Rounded corners for "Capsule" look
                borderSkipped: false, // Rounds the bottom too (optional) or set to 'bottom'
                barPercentage: 0.6, // Thicker, chunkier bars
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, // Cleaner look
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Dark tooltip
                    titleColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return ` Compounds: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    border: { display: false },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)', // Very faint grid
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Inter', weight: '600' }
                    }
                },
                x: {
                    grid: { display: false }, // No vertical lines
                    ticks: {
                        color: '#334155',
                        font: { family: 'Inter', weight: '600', size: 11 }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart' // Smooth, slow 3D rise effect
            }
        }
    });
}

        // Show results
        function showResults() {
            if (!selectedPlant) {
                alert('Please select a plant and apply filters first.');
                return;
            }
            workflowState.screeningApplied = true;
            navigateToSection('results');
            displayResults();
        }

        // Display results table
        function displayResults() {
            document.getElementById('resultsTotal').textContent = currentCompounds.length;
            document.getElementById('resultsPassed').textContent = filteredCompounds.length;
            const tableHTML = `
                <div class="table-responsive-container">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Compound Name</th>
                                <th>PubChem CID</th>
                                <th>Formula</th>
                                <th>MW (g/mol)</th>
                                <th>Bioavailability</th>
                                <th>Drug Likeness</th>
                                <th>Lipinski</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCompounds.length > 0 ? filteredCompounds.map(compound => `
                                <tr>
                                    <td><strong>${compound.name}</strong></td>
                                    <td><a href="https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}" target="_blank" style="color: var(--secondary-blue);">${compound.cid}</a></td>
                                    <td>${compound.formula}</td>
                                    <td>${compound.weight}</td>
                                    <td>${compound.bioavailability.toFixed(2)}</td>
                                    <td>${compound.drugLikeness.toFixed(2)}</td>
                                    <td><span class="badge ${compound.lipinski === 0 || compound.lipinski === '0' ? 'active' : 'inactive'}">${compound.lipinski === 0 || compound.lipinski === '0' ? 'Pass (0)' : 'Fail (' + compound.lipinski + ')'}</span></td>
                                </tr>
                            `).join('') : `<tr><td colspan="7" style="text-align:center; padding: 30px;">No compounds passed the screening criteria. Try adjusting the filters.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('resultsTableContainer').innerHTML = tableHTML;
        }

        // Export results to CSV
        function exportResults() {
            if (filteredCompounds.length === 0) {
                alert('No compounds in the results list to export.');
                return;
            }

            const headers = ['Compound Name', 'PubChem CID', 'Formula', 'Molecular Weight', 'SMILES', 
                            'Bioavailability', 'BBB Permeability', 'Lipinski Violations', 'Drug Likeness',
                            // ADDED 4 NEW HEADERS
                            'QED', 'logP', 'HBA', 'HBD',
                            'Hepatotoxicity', 'Carcinogenicity', 'Immunogenicity', 'Mutagenicity', 'Cytotoxicity'];
            
            let csvContent = headers.join(',') + '\n';
            
            filteredCompounds.forEach(compound => {
                const row = [
                    compound.name,
                    compound.cid,
                    compound.formula,
                    compound.weight,
                    `"${compound.smiles}"`,
                    compound.bioavailability,
                    compound.bbb,
                    compound.lipinski,
                    compound.drugLikeness,
                    // ADDED 4 NEW VALUES
                    compound.qed,
                    compound.logP,
                    compound.hba,
                    compound.hbd,
                    compound.hepatotoxicity,
                    compound.carcinogenicity,
                    compound.immunogenicity,
                    compound.mutagenicity,
                    compound.cytotoxicity
                ];
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `drug_discovery_results_${selectedPlant}_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Show section
       function showSection(sectionId, event) {
    // Always allow access to these sections
    const alwaysAccessible = ['home', 'guide', 'about'];
    
    // Check workflow restrictions
    if (!alwaysAccessible.includes(sectionId)) {
        if (sectionId === 'select' && !workflowState.startDiscoveryClicked) {
            alert('Please click "START DISCOVERY" button from the Home page first.');
            return;
        }
        if (sectionId === 'explore' && !workflowState.plantSelected) {
            alert('Please select a plant first from the "Select Plant" tab.');
            return;
        }
        if (sectionId === 'screen' && !workflowState.dataExplored) {
            alert('Please explore the data first. Visit "Explore Data" tab and proceed.');
            return;
        }
        if (sectionId === 'results' && !workflowState.screeningApplied) {
            alert('Please apply screening filters first from the "Screen Compounds" tab.');
            return;
        }
    }
    
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const tabMap = {'home': 0, 'select': 1, 'explore': 2, 'screen': 3, 'results': 4, 'guide': 5, 'about': 6};
        if(document.getElementById('exploreTab').style.display === 'none'){
            delete tabMap.explore;
            tabMap.screen = 2;
            tabMap.results = 3;
            tabMap.guide = 4;
            tabMap.about = 5;
        }
        if(tabs[tabMap[sectionId]]) tabs[tabMap[sectionId]].classList.add('active');
    }

    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    const el = document.getElementById(sectionId);
    if(el) el.classList.add('active');
}
const canvas = document.getElementById('molecular-canvas');
        const ctx = canvas.getContext('2d');
        let particlesArray;

        // Resize canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        });

        // Create Particle Class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1; // Molecule size
                this.speedX = (Math.random() * 1) - 0.5; // Slow float speed
                this.speedY = (Math.random() * 1) - 0.5;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                // Bounce off edges
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
            }
            draw() {
                ctx.fillStyle = '#0ea5e9'; // Primary Blue
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (canvas.height * canvas.width) / 15000; // Density
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
                connect(particlesArray[i], particlesArray);
            }
            requestAnimationFrame(animate);
        }

        // Draw lines (bonds) between close particles
        function connect(a, particles) {
            for (let b of particles) {
                let dx = a.x - b.x;
                let dy = a.y - b.y;
                let distance = (dx * dx + dy * dy);
                
                if (distance < (canvas.width/9) * (canvas.height/9)) {
                   let opacityValue = 1 - (distance / 20000);
                   ctx.strokeStyle = 'rgba(14, 165, 233,' + opacityValue + ')'; // Blue Bonds
                   ctx.lineWidth = 1;
                   ctx.beginPath();
                   ctx.moveTo(a.x, a.y);
                   ctx.lineTo(b.x, b.y);
                   ctx.stroke();
                }
            }
        }

        init();
        animate();