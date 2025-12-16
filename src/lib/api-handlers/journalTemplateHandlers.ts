import { NextRequest, NextResponse } from 'next/server';
import { getJournalTemplateModel, premadeTemplates } from '@/models/main/journalTemplate.model';

export async function getTemplates(req: NextRequest, uniqueId: string) {
  try {
    const JournalTemplate = await getJournalTemplateModel();
    
    let templates = await JournalTemplate.find({ uniqueId }).sort({ isPremade: -1, usageCount: -1 });
    
    if (templates.length === 0) {
      const defaultTemplates = premadeTemplates.map(template => ({
        ...template,
        uniqueId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await JournalTemplate.insertMany(defaultTemplates);
      templates = await JournalTemplate.find({ uniqueId }).sort({ isPremade: -1, usageCount: -1 });
    }
    
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createTemplate(req: NextRequest, uniqueId: string, body: any) {
  try {
    const JournalTemplate = await getJournalTemplateModel();
    
    const { name, description, icon, color, prompts } = body;
    
    if (!name || !prompts || prompts.length === 0) {
      return NextResponse.json({ error: 'Name and prompts are required' }, { status: 400 });
    }
    
    const template = await JournalTemplate.create({
      uniqueId,
      name,
      description: description || '',
      icon: icon || 'FileText',
      color: color || 'blue',
      prompts,
      isPremade: false,
      isActive: true
    });
    
    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateTemplate(req: NextRequest, uniqueId: string, body: any) {
  try {
    const JournalTemplate = await getJournalTemplateModel();
    
    const { templateId, updates } = body;
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    const template = await JournalTemplate.findOneAndUpdate(
      { _id: templateId, uniqueId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteTemplate(req: NextRequest, uniqueId: string, body: any) {
  try {
    const JournalTemplate = await getJournalTemplateModel();
    
    const { templateId } = body;
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    const template = await JournalTemplate.findOne({ _id: templateId, uniqueId });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (template.isPremade) {
      return NextResponse.json({ error: 'Cannot delete premade templates' }, { status: 403 });
    }
    
    await JournalTemplate.deleteOne({ _id: templateId, uniqueId });
    
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function incrementUsage(req: NextRequest, uniqueId: string, body: any) {
  try {
    const JournalTemplate = await getJournalTemplateModel();
    
    const { templateId } = body;
    
    await JournalTemplate.findOneAndUpdate(
      { _id: templateId, uniqueId },
      { $inc: { usageCount: 1 } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
