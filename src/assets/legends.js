export const legends = {
    publicLand: [
    { label: 'Bureau of Land Management', color: 'yellow' },
    { label: 'Fish & Wildlife Service', color: 'orange' },
    { label: 'Forest Service', color: 'green' },
    { label: 'Local Government', color: 'red' },
    { label: 'National Park Service', color: 'purple' },
    { label: 'Private', color: 'gray', opacity: 0 },  // Clear (transparent)
    { label: 'State', color: 'blue' },
    { label: 'State (Wyoming Game & Fish)', color: 'darkblue' },
    { label: 'Water', color: 'cyan' },
    ],
    zoning_toj_zoning: [
    { label: 'P/SP - Public/Semi-Public', color: '#FF69B4' },
    { label: 'CR-2 - Commercial Residential-2', color: '#FF8C00' },
    { label: 'OR - Office Residential', color: '#8A2BE2' },
    { label: 'CR-1 - Commercial Residential-1', color: '#7FFF00' },
    { label: 'NL-5 - Nbhd Low Density-5', color: '#FF4500' },
    { label: 'NL-2 - Nbhd Low Density-2', color: '#00CED1' },
    { label: 'NH-1 - Nbhd High Density-1', color: '#4B0082' },
    { label: 'NM-2 - Nbhd Med Density-2', color: '#FFD700' },
    { label: 'PR-SK - Planned Resort', color: '#FF6347' },
    { label: 'NL-3 - Nbhd Low Density-3', color: '#40E0D0' },
    { label: 'R - Rural', color: '#FF00FF' },
    { label: 'NM-1 - Nbhd Med Density-1', color: '#20B2AA' },
    { label: 'MHP - Mobile Home Park', color: '#8B0000' },
    { label: 'NL-1 - Nbhd Low Density-1', color: '#4682B4' },
    { label: 'BP - Business Park', color: '#FFDEAD' },
    { label: 'CR-3 - Commercial Residential-3', color: '#DA70D6' },
    { label: 'P - Public Park', color: '#00BFFF' },
    { label: 'DC-2 - Downtown Core 2', color: '#FFD700' },
    { label: 'DC-1 - Downtown Core 1', color: '#228B22' },
    { label: 'TS-1 - Town Square 1', color: '#D2691E' },
    { label: 'TS-2 - Town Square 2', color: '#FF4500' },
    { label: 'PUD-UR', color: '#FF1493' },
    { label: 'PUD-NH-1', color: '#ADFF2F' },
    { label: 'PUD-NL-5', color: '#6495ED' },
    { label: 'PUD-NL-3', color: '#2E8B57' },
    { label: 'PUD-NM-2', color: '#9932CC' },
    { label: 'PUD-NL-2', color: '#8B4513' },
    { label: 'PR', color: '#00FA9A' },
],

    zoning: [
    { label: 'R - Rural', color: '#2E8B57' },          // Sea Green
    { label: 'R1 - Rural 1', color: '#1E90FF' },        // Blue
    { label: 'R2 - Rural 2', color: '#FF7F50' },        // Coral
    { label: 'R3 - Rural 3', color: '#32CD32' },        // Lime Green
    { label: 'PUD R1 - Planned Unit Development Rural 1', color: '#DAA520' },    // Goldenrod
    { label: 'PUD R2 - Planned Unit Development Rural 2', color: '#8A2BE2' },    // Blue Violet
    { label: 'PUD R3 - Planned Unit Development Rural 3', color: '#D2691E' },    // Chocolate
    { label: 'PUD - NC - Planned Unit Development Neighborhood Commercial', color: '#FFB6C1' },  // Light Pink
    { label: 'P - Public Park', color: '#FFD700' },         // Gold
    { label: 'P/SP - Public/Semi-Public', color: '#FF4500' },      // Orange Red
    { label: 'S - Suburban', color: '#A52A2A' },         // Brown
    { label: 'WC - Wilson Commercial', color: '#00CED1' },        // Dark Turquoise
    { label: 'WHB - Workforce Home Business', color: '#9400D3' },       // Dark Violet
    { label: 'NC - Single Family Neighborhood', color: '#FF69B4' },        // Hot Pink
    { label: 'NR-1 - Neighborhood Residential 1', color: '#FF6347' },      // Tomato
    { label: 'AR - Auto-Urban Residential', color: '#ADFF2F' },        // Green Yellow
    { label: 'BP - Business Park', color: '#7FFF00' },        // Chartreuse
    { label: 'PR - Planned Resort', color: '#FF1493' }      // Bright Pink
],

    zoning_toj_zoning: [
    { label: 'LDG', color: '#FFA07A' },      // Light Salmon
    { label: 'DDO-2', color: '#87CEFA' },    // Light Sky Blue
    { label: 'DDO-1', color: '#4682B4' },    // Steel Blue
    { label: 'NRO', color: '#3CB371' },      // Medium Sea Green
    { label: 'OUP', color: '#FFD700' },      // Gold
    { label: 'SRO', color: '#FF6347' }       // Tomato
    ],
    zoningOverlay: [
    { label: 'LDG 6', color: '#FF7F50' },    // Coral
    { label: 'SRO', color: '#FF6347' },      // Tomato
    { label: 'LDG 3', color: '#FFA07A' },    // Light Salmon
    { label: 'LDG 2', color: '#FA8072' },    // Salmon
    { label: 'NRO', color: '#3CB371' },      // Medium Sea Green
    { label: 'SRO 3', color: '#FF4500' },    // Orange Red
    { label: 'NRO 3', color: '#2E8B57' },    // Sea Green
    { label: 'NRO 4', color: '#8FBC8F' },    // Dark Sea Green
    { label: 'NRO 2', color: '#66CDAA' }     // Medium Aquamarine
    ],
    roads: [
    { label: 'US Highway', color: '#FF0000' },     // Bright Red for US Highway
    { label: 'WY Highway/Road', color: '#0000FF' },     // Bright Blue for Wyoming Highway/Road
    { label: 'County', color: '#FFA500' },     // Bright Orange for County
    { label: 'National Park', color: '#FFFF00' },     // Bright Yellow for NP
    { label: 'Forest Service', color: '#32CD32' },     // Bright Green for FS
    { label: 'Other State Roads', color: '#FF69B4' },     // Bright Pink for ID (Other State)
    { label: 'Other', color: '#b29869' }  // Brownish for others
]
    
};

