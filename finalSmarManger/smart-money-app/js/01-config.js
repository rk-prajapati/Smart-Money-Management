/* ============================================================
   01-CONFIG.JS
   CONFIG — Categories, Colors & Constants
   All FIXED DATA of the app: expense/income categories (icon + color),
   payment methods, goal emojis, chart colors, day/month names.
   >>> To add a new category, edit CATS in this file.
   ============================================================ */
'use strict';

/* ================= CONSTANTS ================= */
const PRIMARY='#6366f1', PRIMARY2='#8b5cf6', INCOME_C='#10b981', EXPENSE_C='#f43f5e';
const CATS={
  expense:[
    {id:'food',name:'Food',icon:'🍔',color:'#f97316'},
    {id:'grocery',name:'Groceries',icon:'🛒',color:'#22c55e'},
    {id:'transport',name:'Transport',icon:'🚌',color:'#38bdf8'},
    {id:'fuel',name:'Fuel',icon:'⛽',color:'#f59e0b'},
    {id:'shopping',name:'Shopping',icon:'🛍️',color:'#ec4899'},
    {id:'bills',name:'Bills',icon:'⚡',color:'#6366f1'},
    {id:'rent',name:'Rent',icon:'🏠',color:'#8b5cf6'},
    {id:'health',name:'Health',icon:'💊',color:'#ef4444'},
    {id:'edu',name:'Education',icon:'📚',color:'#14b8a6'},
    {id:'fun',name:'Fun',icon:'🎬',color:'#d946ef'},
    {id:'personal',name:'Personal',icon:'🧴',color:'#06b6d4'},
    {id:'other',name:'Others',icon:'📦',color:'#94a3b8'}
  ],
  income:[
    {id:'salary',name:'Salary',icon:'💼',color:'#10b981'},
    {id:'freelance',name:'Freelance',icon:'💻',color:'#3b82f6'},
    {id:'business',name:'Business',icon:'🏪',color:'#f59e0b'},
    {id:'invest',name:'Investments',icon:'📈',color:'#8b5cf6'},
    {id:'gift',name:'Gift',icon:'🎁',color:'#ec4899'},
    {id:'iother',name:'Others',icon:'➕',color:'#94a3b8'}
  ]
};
const CATMAP={};
CATS.expense.forEach(c=>CATMAP[c.id]=c);
CATS.income.forEach(c=>CATMAP[c.id]=c);
const METHODS=[{id:'upi',n:'UPI',i:'📱'},{id:'cash',n:'Cash',i:'💵'},{id:'card',n:'Card',i:'💳'},{id:'bank',n:'Bank',i:'🏦'}];
const GEMOJIS=['🎯','📱','💻','🚗','✈️','🏠','🎓','💍','🎁','🏋️','👶','🏝️'];
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
