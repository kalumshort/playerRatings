(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/client/GroupClientInitializer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GroupClientInitializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/groupSlice.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function GroupClientInitializer({ groupData }) {
    _s();
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GroupClientInitializer.useEffect": ()=>{
            if (groupData) {
                // Push the server-side data into Redux dictionary
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupDataSuccess"])({
                    [groupData.id]: groupData
                }));
                // Set this as the active club for the UI
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveGroup"])(groupData.id));
            }
        }
    }["GroupClientInitializer.useEffect"], [
        groupData,
        dispatch
    ]);
    return null;
}
_s(GroupClientInitializer, "rAh3tY+Iv6hWC9AI4Dm+rCbkwNE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"]
    ];
});
_c = GroupClientInitializer;
var _c;
__turbopack_context__.k.register(_c, "GroupClientInitializer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/client/DataInitializer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DataInitializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$fixturesSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/fixturesSlice.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$squadSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/squadSlice.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$actions$2f$ratingsActions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/actions/ratingsActions.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function DataInitializer({ clubId, currentYear, groupId }) {
    _s();
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"])();
    // 1. Optimized Boolean selectors
    const hasFixtures = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"])({
        "DataInitializer.useSelector[hasFixtures]": (state)=>!!state.fixtures.byClubId[clubId]?.[currentYear]
    }["DataInitializer.useSelector[hasFixtures]"]);
    const hasSquad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"])({
        "DataInitializer.useSelector[hasSquad]": (state)=>!!state.teamSquads.byClubId[clubId]?.[currentYear]
    }["DataInitializer.useSelector[hasSquad]"]);
    const hasSeasonRatings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"])({
        "DataInitializer.useSelector[hasSeasonRatings]": (state)=>groupId ? !!state.playerRatings.byGroupId[groupId]?.players : false
    }["DataInitializer.useSelector[hasSeasonRatings]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DataInitializer.useEffect": ()=>{
            if (!clubId || !currentYear) return;
            if (!hasFixtures) {
                console.log(`[Data] 📥 Fetching Fixtures: ${clubId} (${currentYear})`);
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$fixturesSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchFixtures"])({
                    clubId,
                    currentYear
                }));
            }
            if (!hasSquad) {
                console.log(`[Data] 📥 Fetching Squad: ${clubId} (${currentYear})`);
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$squadSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchTeamSquad"])({
                    squadId: clubId,
                    currentYear
                }));
            }
            if (groupId && !hasSeasonRatings) {
                console.log(`[Data] 📥 Fetching Season Ratings for Group: ${groupId}`);
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$actions$2f$ratingsActions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchAllPlayersSeasonOverallRating"])({
                    groupId,
                    currentYear
                }));
            }
        }
    }["DataInitializer.useEffect"], [
        clubId,
        currentYear,
        groupId,
        hasFixtures,
        hasSquad,
        hasSeasonRatings,
        dispatch
    ]);
    return null;
}
_s(DataInitializer, "Xs9lOaZcjk286/rea9+yrAE+8P4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"]
    ];
});
_c = DataInitializer;
var _c;
__turbopack_context__.k.register(_c, "DataInitializer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_client_013ebf62._.js.map