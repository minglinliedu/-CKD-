/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateNutrition, PatientData, NutritionResult } from './lib/calculateNutrition';
import { analyzeMealImage } from './lib/gemini';
import { Calculator, Camera, ChefHat, Activity, KeyRound, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleCalculate = () => {
    const res = calculateNutrition(patientData);
    setResult(res);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!imagePreview || !result) return;
    
    setIsAnalyzing(true);
    try {
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imageFile?.type || 'image/jpeg';
      
      const remainingEnergy = result.totalEnergy - consumedEnergy;
      const remainingProtein = result.totalProtein - consumedProtein;
      
      const analysis = await analyzeMealImage(
        base64Data, 
        mimeType, 
        remainingEnergy, 
        remainingProtein,
        result.totalEnergy,
        result.totalProtein
      );
      
      setAnalysisResult(analysis);
      
      // Auto-update consumed amounts after analysis confirmation? 
      // For now, let's just display it.
    } catch (err) {
      console.error(err);
      alert("分析失败，请检查网络或API Key配置。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyMealToConsumed = () => {
    if (analysisResult) {
      setConsumedProtein(prev => prev + analysisResult.estimated_protein);
      setConsumedEnergy(prev => prev + analysisResult.estimated_energy);
      setAnalysisResult(null);
      setImageFile(null);
      setImagePreview(null);
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative z-10 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl">
                <KeyRound size={16} className="mr-2" />
                配置 API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#5E7D56]">获取你的 Gemini API 密钥</DialogTitle>
                <DialogDescription>
                  为了在部署的网站上使用“智能识图”功能，你需要配置一个属于自己的 Google Gemini API 密钥。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#344E41]">1. 申请免费 API Key</h4>
                  <p className="text-sm text-[#344E41]/70">
                    前往 Google AI Studio 官网，登录你的 Google 账号并点击 "Get API Key" 创建一个免费的测试密钥。
                  </p>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-[#5E7D56] hover:underline font-medium">
                    前往 AI Studio 申请 <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#344E41]">2. 填入 Netlify 环境变量</h4>
                  <p className="text-sm text-[#344E41]/70">
                    回到你的 Netlify 部署控制台，依次点击：<br/>
                    <strong>Site configuration</strong> → <strong>Environment variables</strong> → <strong>Add a variable</strong><br/>
                    • 键 (Key) 填入：<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">GEMINI_API_KEY</code><br/>
                    • 值 (Value) 填入：你刚才申请的以 AIzaSy 开头的密钥。
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#c0392b]">3. 重新部署 (重要)</h4>
                  <p className="text-sm text-[#344E41]/70">
                    设置完成后，返回 Netlify 的 <strong>Deploys</strong> 页面，点击 <strong>Trigger deploy</strong> → <strong>Clear cache and deploy site</strong>，等待发布变绿即可。
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="absolute -right-5 -bottom-5 text-8xl opacity-10 select-none">🍃</div>
        </header>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border border-[#DAD7CD] rounded-[16px] p-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <TabsTrigger value="calculator" className="flex items-center gap-2 rounded-[12px] data-[state=active]:bg-[#E9EDC9] data-[state=active]:text-[#5E7D56]">
              <Calculator size={16} /> 营养额度计算
            </TabsTrigger>
            <TabsTrigger value="analyzer" disabled={!result} className="flex items-center gap-2 rounded-[12px] data-[state=active]:bg-[#E9EDC9] data-[state=active]:text-[#5E7D56]">
              <Camera size={16} /> 多模态识餐
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

          <TabsContent value="analyzer" className="space-y-6">
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white">
                  <CardHeader>
                    <CardTitle className="text-[#5E7D56]">每日额度追踪</CardTitle>
                    <CardDescription className="opacity-70">今日消耗与剩余量</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#344E41]">能量 (kcal)</span>
                        <span className="text-[#A3B18A]">{consumedEnergy} / {result.totalEnergy} ({result.totalEnergy - consumedEnergy} 剩余)</span>
                      </div>
                      <Progress value={(consumedEnergy / result.totalEnergy) * 100} className="h-2 [&>div]:bg-[#A3B18A] bg-[#DAD7CD]/50" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#344E41]">蛋白质 (g)</span>
                        <span className="text-[#A3B18A]">{consumedProtein.toFixed(1)} / {result.totalProtein} ({(result.totalProtein - consumedProtein).toFixed(1)} 剩余)</span>
                      </div>
                      <Progress value={(consumedProtein / result.totalProtein) * 100} className="h-2 [&>div]:bg-[#A3B18A] bg-[#DAD7CD]/50" />
                    </div>
                    
                    <Separator className="bg-[#DAD7CD]/50" />

                    <div className="space-y-4 pt-2">
                      <h4 className="font-medium flex items-center gap-2 text-[#5E7D56]"><ChefHat size={18} /> 拍照识餐</h4>
                      <div className="border-2 border-dashed border-[#DAD7CD] rounded-[20px] p-4 text-center hover:bg-[#E9EDC9]/30 transition-colors">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                          id="camera-input"
                        />
                        <label htmlFor="camera-input" className="cursor-pointer flex flex-col items-center justify-center p-6">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-48 object-contain rounded-[12px] shadow-[0_4px_10px_rgba(0,0,0,0.05)]" />
                          ) : (
                            <>
                              <Camera className="w-10 h-10 text-[#A3B18A] mb-3" />
                              <span className="text-[#5E7D56] font-medium">点击拍照或上传食物照片</span>
                              <span className="text-xs text-[#344E41]/60 mt-1">支持 JPEG, PNG 格式</span>
                            </>
                          )}
                        </label>
                      </div>

                      <Button 
                        disabled={!imagePreview || isAnalyzing} 
                        onClick={handleAnalyzeMeal}
                        className="w-full bg-[#A3B18A] hover:bg-[#5E7D56] text-white rounded-[16px] py-6"
                      >
                        {isAnalyzing ? "正在智能分析中..." : "开始 AI 膳食评估"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-[#DAD7CD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] bg-white">
                  <CardHeader>
                    <CardTitle className="text-[#5E7D56]">AI 评估报告</CardTitle>
                    <CardDescription className="opacity-70">Gemini 视觉与营养分析</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!analysisResult ? (
                      <div className="h-full flex flex-col items-center justify-center text-[#A3B18A] py-16 text-center">
                        <ChefHat size={48} className="mb-4 opacity-30" />
                        <p className="text-sm">上传图片并分析，此处将显示</p>
                        <p className="text-sm">该膳食的成分及对今日剩余额度的影响。</p>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-[#DAD7CD] rounded-[20px] flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-xs text-[#344E41]/60 font-medium uppercase">估算热量</span>
                            <span className="text-xl font-bold text-[#5E7D56] mt-1">{analysisResult.estimated_energy} <span className="text-xs font-normal">kcal</span></span>
                          </div>
                          <div className="p-4 bg-white border border-[#DAD7CD] rounded-[20px] flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-xs text-[#344E41]/60 font-medium uppercase">估算蛋白质</span>
                            <span className="text-xl font-bold text-[#5E7D56] mt-1">{analysisResult.estimated_protein} <span className="text-xs font-normal">g</span></span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-[#5E7D56]">识别食物：</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.food_items?.map((item: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-[#E9EDC9]/50 text-[#344E41] text-xs font-medium rounded-full border border-[#DAD7CD]">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-[#5E7D56]">AI 智能指导意见：</h4>
                          <div className="bg-[#F8F9F5] p-5 rounded-[20px] text-sm text-[#344E41] leading-relaxed border border-[#DAD7CD] shadow-inner">
                            {analysisResult.advice}
                          </div>
                        </div>

                        <Button variant="outline" className="w-full border-[#DAD7CD] text-[#5E7D56] hover:bg-[#E9EDC9] hover:text-[#5E7D56] rounded-[16px] py-6" onClick={applyMealToConsumed}>
                          确认吃下：记入今日额度
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
