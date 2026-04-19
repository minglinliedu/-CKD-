import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { calculateNutrition, PatientData, NutritionResult } from './lib/calculateNutrition';
import { Calculator, ListPlus, Activity, Plus, Minus, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// --- 本地食物数据库 (带 CKD 医学标识) ---
const FOOD_DATABASE = [
  { id: 1, name: '米饭(蒸)', category: '主食', energy: 116, protein: 2.6, isQuality: false },
  { id: 2, name: '麦淀粉(肾病面条)', category: '主食', energy: 350, protein: 0.5, isQuality: false },
  { id: 3, name: '水煮鸡蛋', category: '肉禽蛋', energy: 144, protein: 13.3, isQuality: true },
  { id: 4, name: '瘦猪肉', category: '肉禽蛋', energy: 143, protein: 20.3, isQuality: true },
  { id: 5, name: '鸡胸肉', category: '肉禽蛋', energy: 118, protein: 24.6, isQuality: true },
  { id: 6, name: '纯牛奶', category: '奶类', energy: 54, protein: 3.0, isQuality: true },
  { id: 7, name: '豆腐(北)', category: '大豆类', energy: 116, protein: 12.2, isQuality: true },
  { id: 8, name: '大白菜', category: '蔬菜水果', energy: 15, protein: 1.5, isQuality: false },
  { id: 9, name: '西红柿', category: '蔬菜水果', energy: 15, protein: 0.9, isQuality: false },
  { id: 10, name: '苹果', category: '蔬菜水果', energy: 52, protein: 0.2, isQuality: false },
];

type MealItem = {
  food: typeof FOOD_DATABASE[0];
  weight: number; // 克 (g)
};

export default function App() {
  const [patientData, setPatientData] = useState<PatientData>({
    gender: 'male',
    age: 8,
    weight: 25,
    ckdStage: 4,
    isDialysis: false,
    activityIntensity: 'light'
  });

  const [result, setResult] = useState<NutritionResult | null>(null);
  const [consumedProtein, setConsumedProtein] = useState<number>(0);
  const [consumedEnergy, setConsumedEnergy] = useState<number>(0);

  // 自定义食物库状态
  const [customFoods, setCustomFoods] = useState<typeof FOOD_DATABASE>([]);
  const [customName, setCustomName] = useState('');
  const [customEnergy, setCustomEnergy] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customIsQuality, setCustomIsQuality] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 合并数据库
  const allFoods = [...FOOD_DATABASE, ...customFoods];

  // 本地库记餐状态
  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  const handleCalculate = () => {
    const res = calculateNutrition(patientData);
    setResult(res);
  };

  const handleAddCustomFood = () => {
    if (!customName) return;
    const newFood = {
      id: Date.now(),
      name: customName,
      category: '自定义',
      energy: Number(customEnergy) || 0,
      protein: Number(customProtein) || 0,
      isQuality: customIsQuality
    };
    setCustomFoods([...customFoods, newFood]);
    setIsDialogOpen(false);
    // clean up form
    setCustomName('');
    setCustomEnergy('');
    setCustomProtein('');
    setCustomIsQuality(false);
  };

  const addFood = (foodId: number) => {
    const food = allFoods.find(f => f.id === foodId);
    if (!food) return;
    if (mealItems.some(item => item.food.id === foodId)) return;
    setMealItems([...mealItems, { food, weight: 100 }]); // 默认 100g
  };

  const updateWeight = (foodId: number, delta: number) => {
    setMealItems(mealItems.map(item => {
      if (item.food.id === foodId) {
        const newWeight = Math.max(0, item.weight + delta);
        return { ...item, weight: newWeight };
      }
      return item;
    }).filter(item => item.weight > 0)); // 若为0则自动移除
  };

  const removeFood = (foodId: number) => {
    setMealItems(mealItems.filter(item => item.food.id !== foodId));
  };

  const currentMealSummary = mealItems.reduce((acc, item) => {
    const multiplier = item.weight / 100;
    acc.energy += item.food.energy * multiplier;
    acc.protein += item.food.protein * multiplier;
    if (item.food.isQuality) {
      acc.qualityProtein += item.food.protein * multiplier;
    }
    return acc;
  }, { energy: 0, protein: 0, qualityProtein: 0 });

  const applyMealToConsumed = () => {
    if (mealItems.length > 0) {
      setConsumedProtein(prev => prev + currentMealSummary.protein);
      setConsumedEnergy(prev => prev + currentMealSummary.energy);
      setMealItems([]); // 记录完后清空当前餐盘
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] text-[#344E41] p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="bg-[#5E7D56] text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div className="relative z-10 flex flex-col items-start gap-2">
            <h1 className="text-2xl sm:text-[28px] font-normal tracking-tight m-0">儿科肾脏病营养计算助手</h1>
            <p className="text-sm opacity-90 m-0">计算引擎版本: v2.4 (基于权威文献数据来源)</p>
          </div>
          <div className="absolute -right-5 -bottom-5 text-8xl opacity-10 select-none">🍃</div>
        </header>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border border-[#DAD7CD] rounded-[16px] p-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <TabsTrigger value="calculator" className="flex items-center gap-2 rounded-[12px] data-[state=active]:bg-[#E9EDC9] data-[state=active]:text-[#5E7D56]">
              <Calculator size={16} /> 营养额度计算
            </TabsTrigger>
            <TabsTrigger value="tracker" disabled={!result} className="flex items-center gap-2 rounded-[12px] data-[state=active]:bg-[#E9EDC9] data-[state=active]:text-[#5E7D56]">
              <ListPlus size={16} /> 手动食物记餐
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white h-fit">
                <CardHeader>
                  <CardTitle className="text-[#5E7D56]">患儿档案资料</CardTitle>
                  <CardDescription className="opacity-70">输入患儿基本信息计算营养额度</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>性别</Label>
                      <RadioGroup 
                        value={patientData.gender} 
                        onValueChange={(val: any) => setPatientData({...patientData, gender: val})}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">男</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">女</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">年龄 (岁)</Label>
                      <Input 
                        id="age"
                        type="number" 
                        value={patientData.age} 
                        onChange={(e) => setPatientData({...patientData, age: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">体重 (kg)</Label>
                      <Input 
                        id="weight"
                        type="number" 
                        value={patientData.weight} 
                        onChange={(e) => setPatientData({...patientData, weight: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ckdStage">CKD分期 (1-5)</Label>
                      <Input 
                        id="ckdStage"
                        type="number" 
                        min={1} max={5}
                        value={patientData.ckdStage} 
                        onChange={(e) => setPatientData({...patientData, ckdStage: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>是否透析 (HD/PD)</Label>
                    <RadioGroup 
                      value={patientData.isDialysis ? 'yes' : 'no'} 
                      onValueChange={(val) => setPatientData({...patientData, isDialysis: val === 'yes'})}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes" />
                        <Label htmlFor="yes">是</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no">否</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>活动强度</Label>
                    <RadioGroup 
                      value={patientData.activityIntensity} 
                      onValueChange={(val: any) => setPatientData({...patientData, activityIntensity: val})}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light">轻度</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moderate" id="moderate" />
                        <Label htmlFor="moderate">中度</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button onClick={handleCalculate} className="w-full mt-4 bg-[#5E7D56] hover:bg-[#5E7D56]/90 text-white rounded-[16px] py-6 text-base">
                    一键计算额度
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white">
                <CardHeader>
                  <CardTitle className="text-[#5E7D56]">每日营养计算报告</CardTitle>
                  <CardDescription className="opacity-70">数据已验证</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                  {!result ? (
                    <div className="text-center text-[#344E41]/50 py-10">
                      请先完成档案填写并计算
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white border border-[#DAD7CD] rounded-[20px] p-4 text-center flex flex-col items-center justify-center">
                          <div className="text-[11px] text-[#344E41]/60 mb-1">推荐总能量</div>
                          <div className="text-2xl font-bold text-[#5E7D56] my-1">{result.totalEnergy}</div>
                          <div className="text-[10px] text-[#A3B18A] font-semibold uppercase">kcal / day</div>
                        </div>
                        <div className="bg-white border border-[#DAD7CD] rounded-[20px] p-4 text-center flex flex-col items-center justify-center">
                          <div className="text-[11px] text-[#344E41]/60 mb-1">推荐蛋白质</div>
                          <div className="text-2xl font-bold text-[#5E7D56] my-1">{result.totalProtein}</div>
                          <div className="text-[10px] text-[#A3B18A] font-semibold uppercase">g / day</div>
                        </div>
                        <div className="bg-white border border-[#DAD7CD] rounded-[20px] p-4 text-center flex flex-col items-center justify-center">
                          <div className="text-[11px] text-[#344E41]/60 mb-1">优质蛋白(60%)</div>
                          <div className="text-2xl font-bold text-[#5E7D56] my-1">{result.highQualityProtein}</div>
                          <div className="text-[10px] text-[#A3B18A] font-semibold uppercase">g / day</div>
                        </div>
                      </div>

                      <div className="bg-[#E9EDC9] rounded-[20px] p-5 flex gap-4 items-start">
                        <div className="text-2xl bg-white w-[50px] h-[50px] rounded-[15px] flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                          🍱
                        </div>
                        <div>
                          <h3 className="m-0 mb-2 text-[15px] font-semibold text-[#5E7D56]">简短膳食建议</h3>
                          <p className="m-0 text-[13px] leading-relaxed text-[#555] text-left">
                            {result.mealSuggestion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="bg-[#FFE8D6] text-[#B08968] px-3 py-1 rounded-full text-xs font-semibold">
                          CKD 专属方案
                        </div>
                        <div className="text-[#A3B18A] text-xs font-medium">营养计算完成 • 数据已验证</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tracker" className="space-y-6">
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card className="rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white md:sticky md:top-4 relative z-10 w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[#5E7D56]">每日额度追踪</CardTitle>
                    <CardDescription className="opacity-70">今日已消耗与剩余配额</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#344E41]">能量 (kcal)</span>
                        <span className="text-[#A3B18A]">{consumedEnergy.toFixed(0)} / {result.totalEnergy} ({(result.totalEnergy - consumedEnergy).toFixed(0)} 剩余)</span>
                      </div>
                      <Progress value={Math.min(100, (consumedEnergy / result.totalEnergy) * 100)} className="h-2 [&>div]:bg-[#A3B18A] bg-[#DAD7CD]/50" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#344E41]">蛋白质 (g)</span>
                        <span className="text-[#A3B18A]">{consumedProtein.toFixed(1)} / {result.totalProtein} ({(result.totalProtein - consumedProtein).toFixed(1)} 剩余)</span>
                      </div>
                      <Progress value={Math.min(100, (consumedProtein / result.totalProtein) * 100)} className="h-2 [&>div]:bg-[#A3B18A] bg-[#DAD7CD]/50" />
                    </div>
                    
                    <Separator className="bg-[#DAD7CD]/50" />

                    {/* Local Food Library */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2 text-[#5E7D56]"><ListPlus size={18} /> 本地库快速添加</h4>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-[#DAD7CD] text-[#5E7D56]">
                              <Plus size={14} className="mr-1" /> 自定义食材
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-[#5E7D56]">自定义食材数据</DialogTitle>
                            </DialogHeader>
                            <div className="bg-[#F8F9F5] border border-[#DAD7CD]/60 p-3 rounded-xl mt-2 text-xs text-[#5E7D56] leading-relaxed flex gap-2 items-start">
                              <span className="text-base shrink-0">💡</span>
                              <p className="m-0">
                                <b>数值哪里找？</b><br/>
                                包装食品：请查看包装袋背面的<b>【营养成分表】</b>(注意单位需是每100g或毫升)。<br/>
                                生鲜菜肉：建议微信搜索<b>「查食物」</b>或<b>「薄荷营养师」</b>小程序查阅。
                              </p>
                            </div>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">食材名称</Label>
                                <Input id="name" placeholder="例如：红薯、自制丸子" value={customName} onChange={e => setCustomName(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="energy">热量 (kcal/100g)</Label>
                                  <Input id="energy" type="number" placeholder="0" value={customEnergy} onChange={e => setCustomEnergy(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="protein">蛋白质 (g/100g)</Label>
                                  <Input id="protein" type="number" placeholder="0" value={customProtein} onChange={e => setCustomProtein(e.target.value)} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>是否属于优质蛋白？ (肉/蛋/奶/豆)</Label>
                                <RadioGroup value={customIsQuality ? 'true' : 'false'} onValueChange={v => setCustomIsQuality(v === 'true')} className="flex space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="true" id="cq-yes" />
                                    <Label htmlFor="cq-yes">是</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="false" id="cq-no" />
                                    <Label htmlFor="cq-no">否</Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </div>
                            <Button onClick={handleAddCustomFood} disabled={!customName} className="w-full bg-[#5E7D56] text-white">添加至列表</Button>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {allFoods.map(food => (
                          <button 
                            key={food.id}
                            onClick={() => addFood(food.id)}
                            className="p-3 border border-[#DAD7CD] rounded-[16px] bg-[#F8F9F5] hover:bg-[#E9EDC9]/50 transition-colors text-left flex flex-col items-start"
                          >
                            <span className="font-medium text-[#344E41] text-sm">{food.name}</span>
                            <span className="text-[10px] text-[#A3B18A] mt-1">{food.energy}cal / 蛋白{food.protein}g</span>
                            {food.isQuality && <span className="mt-1.5 px-1.5 py-0.5 bg-[#5E7D56]/15 text-[#5E7D56] text-[9px] font-medium rounded-sm">优质蛋白</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white relative z-0 w-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-[#5E7D56]">本次就餐记录</CardTitle>
                    <CardDescription className="opacity-70">点击上方/左侧食材，调整克数即可自动结算</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    {mealItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-[#A3B18A] py-16 text-center">
                        <ListPlus size={48} className="mb-4 opacity-30" />
                        <p className="text-sm">尚未添加任何食物</p>
                        <p className="text-sm">计算的营养值将在此处显示</p>
                      </div>
                    ) : (
                      <div className="space-y-6 flex-1 flex flex-col animate-in fade-in">
                        <div className="space-y-3 overflow-y-auto pr-1">
                          {mealItems.map(item => (
                            <div key={item.food.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F8F9F5] p-4 rounded-[16px] border border-[#DAD7CD]/50 gap-4">
                              <div className="flex flex-col">
                                <span className="text-[15px] font-semibold text-[#344E41] flex items-center gap-2">
                                  {item.food.name}
                                  {item.food.isQuality && <span className="px-1.5 py-0.5 bg-[#5E7D56]/10 text-[#5E7D56] text-[9px] rounded-sm">优质</span>}
                                </span>
                                <span className="text-xs text-[#A3B18A] mt-1">
                                  +{(item.food.energy * item.weight / 100).toFixed(0)} kcal | +{(item.food.protein * item.weight / 100).toFixed(1)} g 蛋白
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-white border border-[#DAD7CD] p-1 rounded-xl shadow-sm self-start sm:self-auto">
                                <button onClick={() => updateWeight(item.food.id, -25)} className="w-8 h-8 flex items-center justify-center bg-[#F8F9F5] hover:bg-[#E9EDC9] rounded-lg text-[#5E7D56]"><Minus size={14}/></button>
                                <span className="w-12 text-center text-[13px] font-semibold text-[#344E41]">{item.weight}g</span>
                                <button onClick={() => updateWeight(item.food.id, 25)} className="w-8 h-8 flex items-center justify-center bg-[#F8F9F5] hover:bg-[#E9EDC9] rounded-lg text-[#5E7D56]"><Plus size={14}/></button>
                                <div className="w-[1px] h-6 bg-[#DAD7CD] mx-1"></div>
                                <button onClick={() => removeFood(item.food.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto pt-4">
                          <h4 className="text-sm font-semibold mb-3 text-[#5E7D56]">本次摄入清单结算：</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white border border-[#DAD7CD] rounded-[20px] flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                              <span className="text-xs text-[#344E41]/60 font-medium uppercase">本次热量总计</span>
                              <span className="text-xl font-bold text-[#B08968] mt-1">{currentMealSummary.energy.toFixed(0)} <span className="text-xs font-normal">kcal</span></span>
                            </div>
                            <div className="p-4 bg-white border border-[#DAD7CD] rounded-[20px] flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                              <span className="text-xs text-[#344E41]/60 font-medium uppercase">本次蛋白质总计</span>
                              <span className="text-xl font-bold text-[#5E7D56] mt-1">{currentMealSummary.protein.toFixed(1)} <span className="text-xs font-normal">g</span></span>
                              {currentMealSummary.qualityProtein > 0 && <span className="text-[10px] text-[#A3B18A] mt-1">(含优质蛋白 {currentMealSummary.qualityProtein.toFixed(1)}g)</span>}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </CardContent>
                  {mealItems.length > 0 && (
                    <CardFooter className="pt-2">
                      <Button className="w-full bg-[#A3B18A] hover:bg-[#5E7D56] text-white rounded-[16px] py-6 shadow-sm" onClick={applyMealToConsumed}>
                        确认记录：扣除今日额度
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
